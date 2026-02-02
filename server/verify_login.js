// Native fetch in Node 18+
const API_BASE = 'http://localhost:3000/api';

async function verifyLoginPersistence() {
    try {
        console.log('1. Signing up new patient with EMAIL...');
        const newPatient = {
            name: 'Login Tester',
            email: 'testlogin@example.com',
            phone: '1234567890',
            age: 25,
            history: 'None'
        };

        const addRes = await fetch(`${API_BASE}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPatient)
        });

        if (!addRes.ok) throw new Error(`Failed to add patient: ${addRes.statusText}`);
        const addedPatient = await addRes.json();
        console.log('   Patient added:', addedPatient.id, 'Email:', addedPatient.email);

        console.log('2. Fetching patients to simulate restart...');
        const fetchRes = await fetch(`${API_BASE}/patients`);
        const patients = await fetchRes.json();

        console.log(`   Fetched ${patients.length} patients.`);
        const found = patients.find(p => p.email === 'testlogin@example.com');

        if (found) {
            console.log('   SUCCESS: Patient found by email! Login will work.');
        } else {
            console.error('   FAILURE: Patient email NOT found in response.');
            console.log('   Data received:', JSON.stringify(patients.find(p => p.id === addedPatient.id), null, 2));
        }

        // Cleanup
        if (addedPatient.id) {
            await fetch(`${API_BASE}/patients/${addedPatient.id}`, { method: 'DELETE' });
            console.log('   Cleanup done.');
        }

    } catch (err) {
        console.error('An error occurred:', err);
    }
}

verifyLoginPersistence();
