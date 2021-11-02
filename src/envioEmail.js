const nodeMailer = require('nodemailer')
const userEmail = process.env.EMAIL_LOGIN
const userPass = process.env.EMAIL_PASS


const remetente = nodeMailer.createTransport({
    service: "hotmail",
    auth: {
        user: userEmail,
        pass: userPass,
    },
});



function enviarEmail(dados){
   if(dados != undefined){
       const info = dados.split('&&')
    remetente.sendMail(destinatario={from:'hotelbips@outlook.com',to:info[0],subject:info[1],text:info[2]}, function (err, info) {
        if (err) {
            console.log(err)
            return
        } else {
            console.log('email enviado com sucesso')
        }
    }) 
   } 

   
  
}

module.exports = {enviarEmail}

//module.exports = {enviarEmail}


