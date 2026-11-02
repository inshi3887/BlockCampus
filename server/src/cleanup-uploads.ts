import {pool,transaction,type DB} from './db.js'
import {deleteImage} from './storage.js'
import {pathToFileURL} from 'node:url'
export async function cleanupUploads(db:DB){return transaction(db,async tx=>{
 const rows=(await tx.query("SELECT u.* FROM uploads u WHERE u.status='pending' AND u.created_at<now()-interval '7 days' AND NOT EXISTS(SELECT 1 FROM posts p WHERE p.upload_id=u.id) AND NOT EXISTS(SELECT 1 FROM ads a WHERE a.upload_id=u.id) FOR UPDATE OF u SKIP LOCKED LIMIT 100")).rows
 for(const upload of rows){await deleteImage(upload.object_key);await tx.query('DELETE FROM uploads WHERE id=$1',[upload.id])}
 return rows.length
})}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{let total=0,n;do{n=await cleanupUploads(pool);total+=n}while(n===100);console.log('Deleted stale orphan uploads:',total)}finally{await pool.end()}}
