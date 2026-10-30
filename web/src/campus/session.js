import {reactive} from 'vue'
export const account=reactive({user:null,guest:false,identity:null,economy:null,saveVersion:0,saveError:'',photo:null,lesson:null,tab:null,ads:[],busy:false})
export async function api(path,body,method='POST') {
 const r=await fetch('/api'+path,{method:body?method:'GET',credentials:'same-origin',headers:body instanceof FormData?{}:{'Content-Type':'application/json'},body:body instanceof FormData?body:body?JSON.stringify(body):undefined})
 const d=await r.json();if(!r.ok){const e=Object.assign(new Error(d.error||'请求失败'),{status:r.status});throw e}return d
}
export const eventKey=()=>crypto.randomUUID()
export async function refreshEconomy(){if(!account.guest)account.economy=await api('/economy')}
export async function logout(){try{await api('/auth/logout',{})}finally{location.reload()}}
