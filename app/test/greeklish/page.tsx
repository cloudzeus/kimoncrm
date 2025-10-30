import { FilenamePreview } from '@/components/shared/filename-preview';

export default function GreeklishTestPage() {
  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Greek to Greeklish Converter</h1>
          <p className="text-muted-foreground">
            Test how Greek characters are converted to safe Latin filenames
          </p>
        </div>

        <div className="space-y-8">
          <FilenamePreview 
            originalFilename="ΞΕΝΟΔΟΧΕΙΑ ΚΑΙ ΕΠΙΧΕΙΡΗΣΕΙΣ ΑΝΤΩΝΗΣ ΜΑΝΤΖΑΒΕΛΑΚΗΣ ΑΕ - RFP Pricing - v7.xlsx"
            inputLabel="Customer RFP Filename"
          />

          <FilenamePreview 
            originalFilename="Κατάστημα Θεσσαλονίκης - Υποδομή - Όροφος 1.xlsx"
            inputLabel="Infrastructure Filename"
          />

          <FilenamePreview 
            originalFilename="Πελάτης: ΑΒΓΔ ΑΕ & ΣΙΑ - BOM.xlsx"
            inputLabel="BOM Filename"
          />
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Character Mapping Examples</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
            <div>
              <div className="text-muted-foreground">Α → A</div>
              <div className="text-muted-foreground">Β → B</div>
              <div className="text-muted-foreground">Γ → G</div>
              <div className="text-muted-foreground">Δ → D</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ε → E</div>
              <div className="text-muted-foreground">Ζ → Z</div>
              <div className="text-muted-foreground">Η → I</div>
              <div className="text-muted-foreground">Θ → TH</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ι → I</div>
              <div className="text-muted-foreground">Κ → K</div>
              <div className="text-muted-foreground">Λ → L</div>
              <div className="text-muted-foreground">Μ → M</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ν → N</div>
              <div className="text-muted-foreground">Ξ → X</div>
              <div className="text-muted-foreground">Ο → O</div>
              <div className="text-muted-foreground">Π → P</div>
            </div>
            <div>
              <div className="text-muted-foreground">Ρ → R</div>
              <div className="text-muted-foreground">Σ → S</div>
              <div className="text-muted-foreground">Τ → T</div>
              <div className="text-muted-foreground">Υ → Y</div>
            </div>
            <div>
              <div className="text-muted-foreground">Φ → F</div>
              <div className="text-muted-foreground">Χ → CH</div>
              <div className="text-muted-foreground">Ψ → PS</div>
              <div className="text-muted-foreground">Ω → O</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground font-semibold mb-2">Special Characters:</div>
              <div className="text-muted-foreground">& → _ (underscore)</div>
              <div className="text-muted-foreground">spaces → _ (underscore)</div>
              <div className="text-muted-foreground">Multiple _ → single _</div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Implementation Details</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ All Greek characters converted to Latin equivalents</li>
            <li>✅ Special characters (accents, diacritics) handled</li>
            <li>✅ Digraphs (ΜΠ→B, ΝΤ→D, ΓΚ→G) properly converted</li>
            <li>✅ Unsafe filename characters replaced with underscores</li>
            <li>✅ Multiple spaces/underscores collapsed to single</li>
            <li>✅ Leading/trailing special characters trimmed</li>
            <li>✅ Maximum filename length enforced (255 chars)</li>
            <li>✅ File extensions preserved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

