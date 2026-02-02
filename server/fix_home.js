const fs = require('fs');
const path = require('path');

const filePath = path.resolve('..', 'src', 'pages', 'Home.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetBlock = `            dispatch({ type: 'ADD_PATIENT', payload: newPatient });
            // Note: Dispatch triggers async API call in AppContext. 
            // We should ideally wait for it, but AppContext dispatch is void.
            // Assuming success for UX flow, or better, we could handle it in AppContext toast.
            // But let's verify login implicitly or just log them in.
            
            // Actually, since we modified backend to hash on POST, we can just log them in on frontend state
            // BUT they need the server ID. 
            // Simpler: Just navigate. The AppContext will update 'patients' state eventually.
            
            login('patient', newPatient);
            addToast('Account created successfully!', 'success');
            navigate('/dashboard');`;

const newBlock = `            try {
                const createdPatient = await dispatch({ type: 'ADD_PATIENT', payload: newPatient });
                if (createdPatient && createdPatient.id) {
                     login('patient', createdPatient);
                     addToast('Account created successfully!', 'success');
                     navigate('/dashboard');
                } else {
                     addToast('Failed to create account. Please try again.', 'error');
                }
            } catch (err) {
                console.error(err);
                addToast('Signup error occurred', 'error');
            }`;

// Normalize line endings
const normalize = str => str.replace(/\r\n/g, '\n').trim();

if (normalize(content).includes(normalize(targetBlock))) {
    // Replace blindly but carefully
    // We need to match precise string in file, so we'll try to find it index-wise
    // Since normalization strips \r, we need to be careful.
    // Let's just use replace with regex for flexible whitespace if valid

    // Fallback: manual replace string
    const parts = content.split('dispatch({ type: \'ADD_PATIENT\', payload: newPatient });');
    if (parts.length > 1) {
        // We found the start.
        // Now find the end: navigate('/dashboard');
        const afterStart = parts[1];
        const endMarker = "navigate('/dashboard');";
        const endIndex = afterStart.indexOf(endMarker);

        if (endIndex !== -1) {
            const before = parts[0];
            const after = afterStart.substring(endIndex + endMarker.length);

            const newContent = before + newBlock + after;
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log("Replaced successfully!");
        } else {
            console.log("Could not find end marker");
        }
    } else {
        console.log("Could not find start marker");
    }
} else {
    console.log("Direct normalized match failed. Trying manual splice...");
    // Same logic as above fallback
    const parts = content.split('dispatch({ type: \'ADD_PATIENT\', payload: newPatient });');
    if (parts.length > 1) {
        const afterStart = parts[1];
        const endMarker = "navigate('/dashboard');";
        const endIndex = afterStart.indexOf(endMarker);

        if (endIndex !== -1) {
            const before = parts[0];
            const after = afterStart.substring(endIndex + endMarker.length);
            const newContent = before + newBlock + after;
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log("Replaced successfully via splice!");
        } else console.log("Splice failed: End marker not found");
    } else console.log("Splice failed: Start marker not found");
}
