import mongoose from 'mongoose';
import dns from 'dns';
import { MongoMemoryServer } from 'mongodb-memory-server';

const DEFAULT_DNS_SERVERS = ['1.1.1.1', '8.8.8.8'];

const sanitizeCredential = (value) => {
    if (!value) return '';
    const trimmed = value.trim();
    return trimmed.startsWith('<') && trimmed.endsWith('>')
        ? trimmed.slice(1, -1)
        : trimmed;
};
const nsLookupSrv = async (host) => {
    const originalServers = dns.getServers();
    const dnsServers = process.env.DNS_SERVERS
        ? process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean)
        : DEFAULT_DNS_SERVERS;

    if (dnsServers.length) dns.setServers(dnsServers);

    try {
        const records = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
        return records.map(({ name, port }) => `${name}:${port}`);
    } finally {
        dns.setServers(originalServers);
    }
};

const connectWithUri = async (uri, options) => {
    await mongoose.connect(uri, options);
};

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database connected'));
        mongoose.connection.on('error', (error) => console.error('MongoDB connection error:', error.message));

        const mongoUri = process.env.MONGODB_URI?.trim();
        const useMemoryMongoFallback = process.env.NODE_ENV !== 'production' && process.env.USE_MEMORY_MONGO !== 'false';

        const options = {
            // Deprecated options are tolerated by driver but harmless; keep timeout
            serverSelectionTimeoutMS: 10000,
        };

        try {
            if (!mongoUri) {
                if (!useMemoryMongoFallback) {
                    throw new Error('Missing MONGODB_URI in environment');
                }
                console.log('No MongoDB URI configured, using an in-memory database for local development');
            } else {
                // First try the provided URI (supports mongodb+srv)
                await connectWithUri(mongoUri, options);
                console.log('Connected to MongoDB successfully');
                return;
            }
        } catch (err) {
            console.error('Primary connect attempt failed:', err.message);

            // If the failure is an SRV query refusal, attempt DNS resolution fallback
            if ((err.message && err.message.includes('querySrv')) || err.code === 'ECONNREFUSED' || err.name === 'MongoServerSelectionError') {
                if (mongoUri) {
                    console.log('Attempting SRV fallback using DNS resolution...');

                    let host;
                    let auth;
                    let dbName = '';
                    let queryString = '';

                    try {
                        const parsed = new URL(mongoUri);
                        host = parsed.hostname;
                        dbName = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : '';
                        auth = parsed.username ? `${parsed.username}:${parsed.password}` : undefined;
                        queryString = parsed.search ? parsed.search.slice(1) : '';
                    } catch (parseErr) {
                        throw new Error('Could not parse mongodb+srv URI for fallback');
                    }

                    if (!host) {
                        throw new Error('Could not parse mongodb+srv host for fallback');
                    }

                    try {
                        const hosts = await nsLookupSrv(host);
                        if (!hosts.length) throw new Error('No SRV hosts found from DNS resolution');

                        const hostList = hosts.join(',');
                        const creds = auth ? `${auth}@` : '';
                        const dbSegment = dbName ? `/${dbName}` : '';
                        const fallbackUri = `mongodb://${creds}${hostList}${dbSegment}?ssl=true&retryWrites=true&w=majority${queryString ? `&${queryString}` : ''}`;

                        console.log('Retrying connection with fallback URI:', fallbackUri.replace(/(:)[^@]+@/, '$1****@'));
                        await connectWithUri(fallbackUri, options);
                        console.log('Connected to MongoDB using fallback hosts');
                        return;
                    } catch (nsErr) {
                        console.error('SRV fallback failed:', nsErr.message || nsErr);
                    }
                }
            }

            if (!useMemoryMongoFallback) {
                throw err;
            }

            console.log('Falling back to an in-memory MongoDB instance for local development');
            const memoryServer = await MongoMemoryServer.create();
            const memoryUri = await memoryServer.getUri();
            await connectWithUri(memoryUri, options);
            console.log('Connected to in-memory MongoDB successfully');
            return;
        }
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message || error);
        process.exit(1);
    }
};

export default connectDB;