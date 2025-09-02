const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('Starting test server...');

app.get('/', (req, res) => {
    res.send('Test server is working!');
});

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});

console.log('Server setup complete');
