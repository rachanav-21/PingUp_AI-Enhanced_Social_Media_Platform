import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { inngest, functions } from './inngest/index.js';
import { serve } from 'inngest/express';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRotes.js';
import postRouter from './routes/postRoutes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import documentRouter from './routes/documentRoutes.js';
import sendEmail from './configs/nodeMailer.js';

const app = express();

await connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('Server is running'));

app.get('/api/test-mail', async (req, res) => {
    try {
        const result = await sendEmail({
            to: process.env.SENDER_EMAIL,
            subject: 'PingUp SMTP Test',
            body: '<p>This is a test email from PingUp.</p>'
        });

        res.json({ ok: true, result });

    } catch (error) {
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

app.use(
    '/api/inngest',
    serve({
        client: inngest,
        functions
    })
);

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/post', postRouter);
app.use('/api/story', storyRouter);
app.use('/api/message', messageRouter);
app.use('/api/document', documentRouter);

export default app;

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 4000;

    app.listen(PORT, () =>
        console.log(`Server is running on port ${PORT}`)
    );
}