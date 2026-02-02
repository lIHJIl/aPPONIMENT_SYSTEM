// Native fetch in Node 18+

// Node 18+ has native fetch
const API_BASE = 'http://localhost:3000/api';

async function cleanup() {
    try {
        console.log('Fetching doctors to find verification entry...');
        const res = await fetch(`${API_BASE}/doctors`);
        const doctors = await res.json();
        const target = doctors.find(d => d.name === 'Dr. Verify Persistence');

        if (target) {
            console.log(`Deleting ${target.name} (${target.id})...`);
            const delRes = await fetch(`${API_BASE}/doctors/${target.id}`, { method: 'DELETE' });
            if (delRes.ok) console.log('Deleted successfully.');
            else console.error('Failed to delete.');
        } else {
            console.log('No verification entry found.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

cleanup();
