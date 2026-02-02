// Native fetch in Node 18+
const API_BASE = 'http://localhost:3000/api';

async function verifyOverhaul() {
    console.log('--- START OVERHAUL VERIFICATION ---');
    try {
        // 1. Signup
        console.log('1. Signup Patient (Secure)...');
        const pData = { name: 'Secure Patient', email: 'secure@test.com', password: 'MySecretPassword123!', age: 40 };
        const signupRes = await fetch(`${API_BASE}/patients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pData)
        });
        const patient = await signupRes.json();
        console.log('   Signed up:', patient.id);

        // 2. Login (Success)
        console.log('2. Login Patient (Correct Password)...');
        const loginRes = await fetch(`${API_BASE}/login/patient`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pData.email, password: pData.password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) console.log('   Login Success:', loginData.success);
        else console.error('   Login FAILED:', loginData);

        // 3. Login (Fail)
        console.log('3. Login Patient (Wrong Password)...');
        const failRes = await fetch(`${API_BASE}/login/patient`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: pData.email, password: 'wrong' })
        });
        if (failRes.status === 401) console.log('   Login Correctly Rejected.');
        else console.error('   Login SHOULD have failed but got:', failRes.status);

        // 4. Appointment Conflict
        console.log('4. Testing Appointment Conflict...');
        // First book
        const apptData = { doctorId: 'doc1', patientId: patient.id, date: '2025-01-01 10:00', reason: 'Test' };
        await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apptData)
        });
        // Second book (Same slot)
        const conflictRes = await fetch(`${API_BASE}/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apptData)
        });
        if (conflictRes.status === 409) console.log('   Conflict Correctly Detected (409 Conflict).');
        else console.error('   Conflict Check FAILED. Status:', conflictRes.status);

        // 5. Cascade Delete
        console.log('5. Testing Cascade Delete...');
        // Verify appointment exists
        const allAppts = await (await fetch(`${API_BASE}/appointments`)).json();
        const myAppt = allAppts.find(a => a.patientId === patient.id);
        console.log('   Appointment exists:', !!myAppt);

        // Delete patient
        await fetch(`${API_BASE}/patients/${patient.id}`, { method: 'DELETE' });
        console.log('   Patient deleted.');

        // Verify appointment gone
        const afterAppts = await (await fetch(`${API_BASE}/appointments`)).json();
        const orphan = afterAppts.find(a => a.patientId === patient.id);
        if (!orphan) console.log('   SUCCESS: Appointment was cascaded deleted.');
        else console.error('   FAILURE: Orphan appointment remains.');

    } catch (e) {
        console.error('ERROR:', e);
    }
    console.log('--- END ---');
}

verifyOverhaul();
