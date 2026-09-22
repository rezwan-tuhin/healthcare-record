import mongoose from 'mongoose';


declare global {
    var mongooseCache: {
        conn: mongoose.Connection | null;
        promise: Promise<mongoose.Connection> | null
    } 
    | undefined;
}


const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/healthproject';

const cache = globalThis.mongooseCache ?? {conn: null, promise: null};

if(!globalThis.mongooseCache) {
    globalThis.mongooseCache = cache;
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
    if(cache.conn) return cache.conn;

    if(!cache.promise) {
        cache.promise = mongoose.connect(MONGODB_URI).then((m) => m.connection);
    }

    try{
        cache.conn = await cache.promise;
    }catch(error) {
        cache.promise = null;
        throw error;
    }

    return cache.conn;
}