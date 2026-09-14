import {getDatabase} from '@netlify/database';
import {createApi} from '../../server/api.mjs';
const schema=[`CREATE TABLE IF NOT EXISTS workspaces (owner TEXT PRIMARY KEY,body TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0)`,`CREATE TABLE IF NOT EXISTS demo_sessions (id TEXT PRIMARY KEY,owner TEXT NOT NULL,role TEXT NOT NULL,expires BIGINT NOT NULL)`,`CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,mime TEXT NOT NULL,content TEXT NOT NULL)`];
const handler=createApi({name:'PostgreSQL · Netlify Database',init:async()=>{const db=getDatabase();for(const s of schema)await db.sql.unsafe(s)},query:async(s,p=[])=>{let i=0;return await getDatabase().sql.unsafe(s.replace(/\?/g,()=>'$'+(++i)),p)}});
export default handler;
export const config={path:'/api/*'};
