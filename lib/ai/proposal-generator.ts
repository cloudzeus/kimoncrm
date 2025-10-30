import OpenAI from 'openai';

const deepseek = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_API_KEY,
});

interface ProposalGenerationData {
  customerName: string;
  customerAddress?: string;
  contactName?: string;
  contactEmail?: string;
  projectTitle: string;
  projectDescription?: string;
  projectScope?: string;
  
  // Infrastructure data from site survey
  buildingsData?: any;
  siteConnectionsData?: any;
  
  // Equipment data from RFP
  products: Array<{
    name: string;
    brand?: string;
    category?: string;
    quantity: number;
    specifications?: any;
  }>;
  
  services: Array<{
    name: string;
    category?: string;
    quantity: number;
    description?: string;
  }>;
}

/**
 * Generate comprehensive AI-powered technical description for a proposal
 * Returns Greek text suitable for customer-facing technical proposals
 */
export async function generateProposalContent(
  data: ProposalGenerationData
): Promise<{
  infrastructureDesc: string;
  technicalDesc: string;
  productsDesc: string;
  servicesDesc: string;
  scopeOfWork: string;
}> {
  try {
    // System prompt for proposal generation
    const systemPrompt = `Είσαι ειδικός σύμβουλος τεχνικών προτάσεων για έργα δικτύου και υποδομής IT.
Η δουλειά σου είναι να δημιουργήσεις αναλυτική τεχνική περιγραφή σε ελληνικά για πελάτες, βασισμένη στα δεδομένα που παρέχονται.

ΟΔΗΓΙΕΣ:
1. Γράψε όλα τα κείμενα στα ελληνικά με ΚΑΝΟΝΙΚΗ γραφή (όχι κεφαλαία, με τόνους)
2. Χρησιμοποίησε επαγγελματική και κατανοητή γλώσσα για τους πελάτες
3. Εστίασε στα οφέλη και τα χαρακτηριστικά της λύσης
4. Οργάνωσε τα προϊόντα ανά κατηγορία και brand
5. Εξήγησε πώς κάθε στοιχείο συνεισφέρει στη συνολική λύση
6. Παρουσίασε τις υπηρεσίες με σαφήνεια και αξία
7. Δημιούργησε περιεκτικό και λεπτομερή εμβέλεια εργασιών
8. Γράψε σε φυσική, ευανάγνωστη μορφή με κεφαλαία μόνο στην αρχή των προτάσεων
9. Χρησιμοποίησε **έντονη γραφή** (με διπλά αστερίσκους) για σημαντικές λέξεις και φράσεις
10. Χρησιμοποίησε bullet points (με - ή • στην αρχή της γραμμής) για λίστες
11. Οργάνωσε το κείμενο σε παραγράφους με υποτίτλους σε ΚΕΦΑΛΑΙΑ για καλύτερη αναγνωσιμότητα

ΑΠΑΙΤΗΣΕΙΣ ΜΕΓΕΘΟΥΣ:
- Περιγραφή Υποδομής (infrastructureDesc): Τουλάχιστον 800-1200 λέξεις, εκτενής ανάλυση
- Τεχνική Περιγραφή (technicalDesc): Τουλάχιστον 800-1200 λέξεις, λεπτομερής τεχνική ανάλυση
- Περιγραφή Προϊόντων (productsDesc): 400-600 λέξεις
- Περιγραφή Υπηρεσιών (servicesDesc): 600-900 λέξεις, αναλυτική περιγραφή με σχέση στο έργο
- Εμβέλεια Εργασιών (scopeOfWork): 500-700 λέξεις

Για την ΥΠΟΔΟΜΗ γράψε εκτενώς για:
- Λεπτομερή τοπολογία δικτύου
- Αρχιτεκτονική συστήματος (racks, servers, networking)
- Φυσική διάταξη και χωροθέτηση
- Καλωδίωση και connectivity
- Redundancy και high availability
- Scalability και μελλοντική επέκταση

Για την ΤΕΧΝΙΚΗ ΠΕΡΙΓΡΑΦΗ γράψε εκτενώς για:
- Τεχνολογίες που χρησιμοποιούνται
- Protocols και standards
- Security measures
- Performance characteristics
- Integration με υπάρχοντα συστήματα
- Monitoring και management

Για τις ΥΠΗΡΕΣΙΕΣ γράψε εκτενώς για:
- Σχέση κάθε υπηρεσίας με την υποδομή και τα προϊόντα
- Πώς οι υπηρεσίες υποστηρίζουν την υλοποίηση του έργου
- Χρονοδιάγραμμα και φάσεις παροχής υπηρεσιών
- Deliverables και παραδοτέα για κάθε υπηρεσία
- Τεχνική υποστήριξη και maintenance
- Training και knowledge transfer
- Οφέλη για τον πελάτη από κάθε υπηρεσία
- SLA και quality assurance
Χρησιμοποίησε πληροφορίες από την υποδομή, τα προϊόντα και την τεχνική περιγραφή για να δημιουργήσεις μια ολοκληρωμένη εικόνα.

Απάντησε σε μορφή JSON με τα εξής πεδία:
{
  "infrastructureDesc": "Εκτενής περιγραφή υποδομής και τοπολογίας (800-1200 λέξεις)",
  "technicalDesc": "Λεπτομερής τεχνική περιγραφή λύσης (800-1200 λέξεις)",
  "productsDesc": "Περιγραφή προϊόντων ανά κατηγορία/brand (400-600 λέξεις)",
  "servicesDesc": "Αναλυτική περιγραφή υπηρεσιών σε σχέση με όλο το έργο (600-900 λέξεις)",
  "scopeOfWork": "Εμβέλεια εργασιών (500-700 λέξεις)"
}`;

    // Prepare user message with all data
    const userMessage = `
ΠΛΗΡΟΦΟΡΙΕΣ ΠΕΛΑΤΗ:
Πελάτης: ${data.customerName}
${data.customerAddress ? `Διεύθυνση: ${data.customerAddress}` : ''}
${data.contactName ? `Επικοινωνία: ${data.contactName}` : ''}

ΕΡΓΟ:
Τίτλος: ${data.projectTitle}
${data.projectDescription ? `Περιγραφή: ${data.projectDescription}` : ''}
${data.projectScope ? `Σκοπός: ${data.projectScope}` : ''}

ΥΠΟΔΟΜΗ:
${data.buildingsData ? JSON.stringify(data.buildingsData, null, 2) : 'Χωρίς δεδομένα υποδομής'}

ΠΡΟΪΟΝΤΑ (${data.products.length}):
${data.products.map(p => `- ${p.name} (${p.brand || 'N/A'} - ${p.category || 'N/A'}) x${p.quantity}`).join('\n')}

ΥΠΗΡΕΣΙΕΣ (${data.services.length}):
${data.services.map(s => `- ${s.name} (${s.category || 'N/A'}) x${s.quantity}`).join('\n')}

Δημιούργησε μια πλήρη τεχνική πρόταση σε ελληνικά με κανονική γραφή (με τόνους και πεζά-κεφαλαία).
`;

    // Call DeepSeek with extended token limit for comprehensive proposals
    const response = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 8000, // Increased significantly for longer, more detailed content
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsedContent = JSON.parse(content);

    return {
      infrastructureDesc: parsedContent.infrastructureDesc || '',
      technicalDesc: parsedContent.technicalDesc || '',
      productsDesc: parsedContent.productsDesc || '',
      servicesDesc: parsedContent.servicesDesc || '',
      scopeOfWork: parsedContent.scopeOfWork || '',
    };
  } catch (error) {
    console.error('Proposal AI generation error:', error);
    throw new Error('Failed to generate proposal content');
  }
}

/**
 * Refine/edit existing proposal content based on user feedback
 */
export async function refineProposalContent(
  existingContent: string,
  userFeedback: string,
  section: 'infrastructure' | 'technical' | 'products' | 'services' | 'scope'
): Promise<string> {
  try {
    const systemPrompt = `Είσαι ειδικός σύμβουλος τεχνικών προτάσεων.
Η δουλειά σου είναι να βελτιώσεις/επεξεργαστείς το υπάρχον κείμενο με βάση τα σχόλια του χρήστη.
Διατήρησε την επαγγελματική γλώσσα και γράψε στα ελληνικά με κανονική γραφή (με τόνους και πεζά-κεφαλαία).`;

    const userMessage = `
ΥΠΑΡΧΟΝ ΚΕΙΜΕΝΟ:
${existingContent}

ΣΧΟΛΙΑ ΧΡΗΣΤΗ:
${userFeedback}

Επεξεργάσου το κείμενο σύμφωνα με τα σχόλια και επέστρεψε το βελτιωμένο κείμενο.
`;

    const response = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    return response.choices[0]?.message?.content || existingContent;
  } catch (error) {
    console.error('Proposal refinement error:', error);
    throw new Error('Failed to refine proposal content');
  }
}

