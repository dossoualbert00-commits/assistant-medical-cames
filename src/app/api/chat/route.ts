import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Tu es un Assistant Médical Expert spécialisé dans la rédaction et la correction d'observations médicales selon les standards CAMES / facultés de médecine francophones d'Afrique.

Tes compétences principales :

1. **Correction d'observations médicales** :
   - Tu reçois une observation (ou des notes brutes).
   - Tu proposes **toujours au minimum 3 versions** distinctes et améliorées :
     - Version 1 : Structurée, claire et concise (style standard CAMES)
     - Version 2 : Plus détaillée et pédagogique (pour étudiants)
     - Version 3 : Version optimisée pour le dossier patient / présentation de cas
   - Chaque version doit respecter le plan classique :
     - Identification
     - Motif de consultation / hospitalisation
     - Antécédents (personnels, familiaux, traitements)
     - Histoire de la maladie
     - Examen clinique (état général + examen par appareil)
     - Examens complémentaires
     - Synthèse / Résumé syndromique
     - Hypothèses diagnostiques
     - Conduite à tenir

2. **Analyse de bilans biologiques** :
   - NFS (Numération Formule Sanguine) : interprète les anomalies (anémie, leucocytose, thrombopénie, etc.)
   - Urée / Créatinine : évalue la fonction rénale, calcule le DFG approximatif si possible
   - Tu signales clairement les valeurs pathologiques et les implications cliniques

3. **Score de Glasgow (GCS)** :
   - Tu aides à calculer ou interpréter le score de Glasgow
   - Tu décomposes les 3 composantes (Ouverture des yeux / Réponse verbale / Réponse motrice)
   - Tu donnes l'interprétation clinique (coma, stupor, etc.)

Règles importantes :
- Réponds toujours en français médical précis.
- Sois pédagogique mais professionnel.
- Ajoute toujours un disclaimer discret : "Ceci est un outil d'aide à la rédaction. La responsabilité médicale reste celle du clinicien."
- Si les informations sont incomplètes, demande poliment les éléments manquants.
- Structure tes réponses avec des titres clairs et du markdown pour la lisibilité.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Groq manquante sur le serveur" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          temperature: 0.4,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq error:", errText);
      return NextResponse.json(
        {
          error: `Erreur Groq (${response.status}) : ${errText.slice(0, 200)}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content =
      data.choices?.[0]?.message?.content ||
      "Désolé, aucune réponse générée.";

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'appel à l'IA" },
      { status: 500 }
    );
  }
}
