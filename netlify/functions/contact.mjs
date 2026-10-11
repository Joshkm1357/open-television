// Netlify Function: securely forwards contact submissions to a private Discord webhook.
export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', {status:405, headers:{Allow:'POST'}});
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return new Response('Invalid submission', {status:400});
    // Honeypot: silently accept obvious automated submissions without posting to Discord.
    if (body.website) return Response.json({success:true});
    const {name,email,subject,message} = body;
    const valid = (v,max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
    if (!valid(name,100) || !valid(email,254) || !valid(subject,150) || !valid(message,3000) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response('Please check the form fields', {status:400});
    const webhook = process.env.DISCORD_CONTACT_WEBHOOK_URL;
    if (!webhook) return new Response('Contact service not configured', {status:503});
    const safe = (s) => s.trim().replace(/@/g,'@\u200b').replace(/`/g,"'");
    const result = await fetch(webhook, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({allowed_mentions:{parse:[]},embeds:[{title:'📩 New Open Television Contact Message',color:3447003,fields:[{name:'Name',value:safe(name)},{name:'Email',value:safe(email)},{name:'Topic',value:safe(subject)},{name:'Message',value:safe(message).slice(0,1024)}]}]})});
    if (!result.ok) return new Response('Message delivery failed', {status:502});
    return Response.json({success:true});
  } catch {return new Response('Unable to process submission', {status:400});}
};
