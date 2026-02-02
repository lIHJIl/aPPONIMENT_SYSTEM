// Native fetch is available in Node 18+

// Node 18+ has native fetch
const API_BASE = 'http://localhost:3000/api';

async function verify() {
    try {
        console.log('1. Fetching initial doctors...');
        const initialRes = await fetch(`${API_BASE}/doctors`);
        const initialDoctors = await initialRes.json();
        console.log(`   Found ${initialDoctors.length} doctors.`);

        const newDoctor = {
            name: 'Dr. Verify Persistence',
            specialty: 'Debugger',
            experience: 99,
            image: ''
        };

        console.log('2. Adding new doctor...');
        const addRes = await fetch(`${API_BASE}/doctors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDoctor)
        });

        if (!addRes.ok) throw new Error(`Failed to add doctor: ${addRes.statusText}`);
        const addedDoc = await addRes.json();
        console.log('   Doctor added:', addedDoc.id);

        console.log('3. Fetching doctors again...');
        const finalRes = await fetch(`${API_BASE}/doctors`);
        const finalDoctors = await finalRes.json();
        console.log(`   Found ${finalDoctors.length} doctors.`);

        const found = finalDoctors.find(d => d.id === addedDoc.id);
        if (found) {
            console.log('   SUCCESS: New doctor found in API response.');
        } else {
            console.error('   FAILURE: New doctor NOT found in API response.');
        }

    } catch (err) {
        console.error('An error occurred:', err);
    }
}

verify();
