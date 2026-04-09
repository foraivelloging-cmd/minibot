const {getGroupSettings}=require('../../database');module.exports={name:'moderation',aliases:['mod'],category:'group',description:'Show moderation toggles',usage:'.moderation',groupOnly:true,adminOnly:true,async execute(sock,msg,args,extra){try{const s=getGroupSettings(extra.from);await extra.reply(`🛡️ *Moderation Settings*
antilink: ${s.antilink}
antibadword: ${s.antibadword}
antibot: ${s.antibot}
antifake: ${s.antifake}
antispam: ${s.antispam}
antiviewonce: ${s.antiviewonce}
autosticker: ${s.autosticker}`);}catch(e){await extra.reply(`❌ ${e.message}`);}}};