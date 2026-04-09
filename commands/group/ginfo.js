module.exports={name:'ginfo',aliases:['groupinfo'],category:'group',description:'Show group info',usage:'.ginfo',groupOnly:true,async execute(sock,msg,args,extra){try{const md=extra.groupMetadata;if(!md)return extra.reply('❌ Unable to fetch group info.');const text=`*📊 Group Info*

*Name:* ${md.subject}
*Members:* ${md.participants?.length||0}
*ID:* ${md.id}`;await extra.reply(text);}catch(e){await extra.reply(`❌ ${e.message}`);}}};