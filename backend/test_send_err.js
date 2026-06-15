import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const token = jwt.sign({ id: '6a3043e14e1e95aa120b2079' }, process.env.JWT_SECRET, {
  expiresIn: '7d'
});

async function simulate() {
  console.log('Sending request to server...');
  try {
    const res = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        receiverId: '6a30441a4e1e95aa120b209a',
        isTemporary: false,
        expiryDuration: ''
      })
    });
    
    const status = res.status;
    const body = await res.text();
    console.log(`Status: ${status}`);
    console.log(`Body: ${body}`);
  } catch (err) {
    console.error('Failed:', err);
  }
}

simulate();
