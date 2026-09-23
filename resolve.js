const fs = require('fs');

function processFile(file, preferOurs) {
  let content = fs.readFileSync(file, 'utf8');
  let result = [];
  let inConflict = false;
  let lines = content.split('\n');
  let ours = [];
  let theirs = [];
  let state = 0; // 0=normal, 1=ours, 2=theirs

  for (let line of lines) {
    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      ours = [];
      theirs = [];
      state = 1;
      continue;
    }
    if (line.startsWith('=======')) {
      state = 2;
      continue;
    }
    if (line.startsWith('>>>>>>>')) {
      state = 0;
      inConflict = false;
      // Resolve
      if (preferOurs === true) {
        result.push(...ours);
      } else if (preferOurs === false) {
        result.push(...theirs);
      } else {
        // Custom resolution per file could go here
        result.push('// TODO: unresolved');
      }
      continue;
    }
    
    if (state === 0) result.push(line);
    else if (state === 1) ours.push(line);
    else if (state === 2) theirs.push(line);
  }
  
  fs.writeFileSync(file, result.join('\n'), 'utf8');
}

// Custom resolutions:
// StatusModal: Theirs has the WhatsApp notification code + React Native modal. Our HEAD also has React Native modal, but without WhatsApp. Theirs is better.
processFile('src/components/RepairCard/StatusModal.tsx', false);

// SecureImage: Theirs has the private bucket URL check. We want theirs.
processFile('src/components/SecureImage.tsx', false);

// RepairsContext: Theirs has the refetch throttling. We want theirs.
processFile('src/context/RepairsContext.tsx', false);

// supabaseData.ts: Theirs has the transaction logic and parts usage logic. We want theirs.
processFile('src/db/supabaseData.ts', false);

// ProblemSection: Ours has UI formCard. Theirs has Inventory picker. We need a manual merge here, so let's skip automatic for ProblemSection.

// useRepairSave: Theirs has inventory logic. We need a manual merge.

// FinanceScreen: Ours has the new UI. Theirs has ?? wait. In FinanceScreen, the user did a massive UI revamp. So we prefer Ours! Wait, did Theirs have any logic changes? Let's check git log. "Add WhatsApp status update notifications in StatusModal, RepairCard, and RepairDetailScreen." FinanceScreen doesn't seem to have much logic changes from bot. But I should check.

// HomeScreen: Theirs has performance optimizations. Ours has UI changes? The user did UI changes to HomeScreen earlier.

// RepairDetailScreen: Ours has UI layout changes. Theirs has WhatsApp notification and parts usage display.

console.log('Processed some files.');
