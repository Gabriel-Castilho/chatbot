require("dotenv").config({ path: "../.env" });
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
var express = require("express");
const fs = require("fs")
var app = express();
console.log(accountSid + "" + authToken + "" + process.env.TWILIO_ACCOUNT_SID);
const client = require("twilio")(accountSid, authToken);
const email = require("./envioEmail");
const quarto = require('./envioDoQuarto')
const { MessagingResponse } = require("twilio").twiml;
app.use(express.urlencoded({ extended: true }));
const axios = require("axios");
var menu = false;
var voltar = false;
var envio = false;
var valida = false;
var valida2 = false;
var valida3 = false;
var proximaEtapa = false;
var escreveu = false;



app.get("/", function (req, res) {
  res.send("Hello World!");

  client.messages.create({
    body: `SERVER INICIADO.\nReserva`,
    mediaUrl: ["https://cataas.com/cat"],

    from: "whatsapp:+14155238886",
    to: "whatsapp:+5512991435651",
  }).then((message) => console.log(JSON.stringify(message)));
});

app.post("/whatsapp", async (req, res) => {

  const incomingWhatsappMsg = req.body.Body.toLowerCase();
  const twiml = new MessagingResponse();
  const results = twiml.message();

  try {
    if (incomingWhatsappMsg == "reserva") {
      res.header("Content-Type", "text/xml").status(200);
      results.body(
        "Olá, Seja bem vindo ao Hotel Bips! eu sou a *Liza* atendente virtual do Hotel, deseja iniciar o atendimento? Digite *Sim* ou *Não* ");
      menu = true;
      voltar = false;
      res.send(results.toString());
    } else if (
      (incomingWhatsappMsg == "sim" && menu) || (incomingWhatsappMsg == "voltar" || incomingWhatsappMsg == 'cancelar' ? (voltar = true) : "")
    ) {
      if (incomingWhatsappMsg == "voltar") {
        menu = false;
      }
      res.header("Content-Type", "text/xml").status(200);
      results.body(
        `Para agilizar o atendimento Por favor escolha uma opção abaixo ${decodeURI(
          "%F0%9F%91%87"
        )} 
          Digite *1* para fazer *Reserva de quarto* 
          Digite *2* para *consultar* uma *reserva*  
          Digite *3* para *cancelar* uma *reserva*
          Digite *4* para enviar um *email* para nós
          Digite *5* para visualizar nossos quartos`
      );

      res.end(results.toString());
    } else if ((incomingWhatsappMsg == "1" && menu) || (incomingWhatsappMsg == "1" && voltar)) {
      if ((incomingWhatsappMsg == 1 && envio == false) || (envio && incomingWhatsappMsg != 1)) {
        if (!envio) {
          res.header("Content-Type", "text/xml").status(200);
          envio = true
          results.body("Antes de iniciar uma reserva, preciso de alguns dados. Poderia informar por gentileza o seu nome, sobrenome,CPF separado por virgulas? \nExemplo: João,Silva,12345678901?\n*CONFIRME SEUS DADOS ANTES DE ENVIAR!!!*")
        }
      }
      envio = undefined; 
      res.end(results.toString());
    } else if (envio == undefined) {
      const dados = req.body.Body.split(",")
      res.header("Content-Type", "text/xml").status(200);
      results.body("Seu nome é " + dados[0] + " " + dados[1] + " e seu cpf é " + dados[2] + ".\nPosso confirmar esses dados? Digite *confirmar* ou *cancelar*");

      if (envio == undefined) {
        const dados = req.body.Body.split(',')
        fs.writeFile('dados.txt', dados[0] + "," + dados[1] + "," + dados[2], function (err) {
          if (err) {
            console.log(err)
          }
        });
      }

      envio = false
      res.end(results.toString())
    } else if (incomingWhatsappMsg == 'confirmar' && envio == false) {
      if (incomingWhatsappMsg == 'confirmar') {
        fs.readFile('dados.txt', async function (err, data) {
          if (err) {
            console.log(err)
          }
          const content = data;
          var string = content.toString().split(',')
          var numero = req.body.From.split("+");
          try {
            await axios.post("https://api-hotel-chatbot.herokuapp.com/cliente", {
              nome: string[0],
              sobrenome: string[1].trim(),
              telefone: numero[1],
              cpf: string[2].trim()
            })
          } catch (err) {
            console.log(err.data)
          }
        })
        res.header("Content-Type", "text/xml").status(200);
        results.body(
          "Ótimo, já tenho uma reserva para o seu nome. Agora iremos escolher a duração da estadia. \nPara qual data você deseja a estadia? E para quantos ocupantes? *Escreva separado por virgulas*\nExemplo:01/01/2021,10/01/2021,2\n*A primeira data é a entrada, a segunda data é a saída, e o terceiro número é o número de ocupantes*"
        );
        proximaEtapa = true
        res.end(results.toString())
      }
    } else if (proximaEtapa) {
      const dados2 = req.body.Body.split(',')

      fs.readFile('dados.txt', function (err, data) {
        if (err) {
          console.log(err);
        }
        const content = data;
        var stringCPF = content.toString().split(',');

        fs.writeFile('estadia.txt', dados2[0] + "," + dados2[1] + "," + dados2[2] + "," + stringCPF[2], function (err, data) {
          if (err) {
            console.log(err)
          }
        })
        proximaEtapa = false
      })
      res.header("Content-Type", "text/xml").status(200);
      results.body(
        "Sua data de entrada é: " +
        dados2[0] +
        "\nSua data de saída é: " +
        dados2[1] +
        "\nO total de ocupantes: " +
        dados2[2] +
        ".\nEstá correto esses dados? Digite *correto* ou *cancelar*"
      );
      res.end(results.toString());
    } else if (incomingWhatsappMsg == 'correto' && !proximaEtapa) {
      fs.readFile('estadia.txt', async function (err, data) {
        if (err) {
          console.log(err);
        }
        const content = data;
        var string = content.toString().split(',');
        try {
          await axios.post("https://api-hotel-chatbot.herokuapp.com/estadia",
            {
              cpf: string[3],
              data_entrada: string[0],
              data_saida: string[1].trim(),
              ocupantes: string[2].trim(),
            })
        } catch (err) {
          console.log(err.data)
        }
      }

      )
      res.header("Content-Type", "text/xml").status(200);
      results.body("Parabéns, sua reserva foi registrada com sucesso. Em breve entraremos em contato para escolha dos quartos.\nDigite voltar para ir para o menu.");

      if (incomingWhatsappMsg == 1) {
        envio = true;
        results.body("Antes de iniciar uma reserva, preciso de alguns dados. Poderia informar por gentileza o seu nome, sobrenome,CPF separado por virgulas? \nExemplo: João,Silva,12345678901?\n*CONFIRME SEUS DADOS ANTES DE ENVIAR!!!*");
      }
      res.end(results.toString());
    }

    else if ((incomingWhatsappMsg == "2" && menu) || (incomingWhatsappMsg == "2" && voltar)) {
      res.header("Content-Type", "text/xml").status(200);
      results.body("Digite seu CPF para consultar uma reserva")
      console.log('vvalida 1' + valida2)
      valida = true
      res.end(results.toString());

    }

    else if (valida == true && incomingWhatsappMsg != "3" && valida2 == false && incomingWhatsappMsg != "4") {
      const dados = req.body.Body
      await axios.get("https://api-hotel-chatbot.herokuapp.com/cliente/" + dados).then((response) => (
        results.body("Você tem uma reserva. Confira os dados abaixos\nNome: " + response.data[0].nome + " " + response.data[0].sobrenome + "\nTelefone: " + response.data[0].telefone_celular + "\nCPF: " + response.data[0].cpf + "\nPara mais ações digite *voltar*")
      )).catch((err) => {
        results.body("Esse CPF não consta em nossas base de dados.\nDigite voltar para conferir os dados digitados")
      })
      res.header("Content-Type", "text/xml").status(200);
      valida = false;
      res.end(results.toString());
    }

    else if ((incomingWhatsappMsg == "3" && menu) || (incomingWhatsappMsg == "3" && voltar)) {
      res.header("Content-Type", "text/xml").status(200);
      results.body("Digite seu CPF para cancelar uma reserva")
      valida2 = true
      res.end(results.toString());

    } else if ((incomingWhatsappMsg == '4' && menu) || (incomingWhatsappMsg == '4' && voltar)) {
      if (valida3 == false) {
        res.header("Content-Type", "text/xml").status(200);
        results.body("Para mandar um email, escreva o seu email, o assunto e o texto da mensagem separado pelo && duplo.\n*EXEMPLO* seuemail@email.com&&assunto do email&&texto do email.")
        valida3 = true;
        res.end(results.toString());
      }
    } else if ((incomingWhatsappMsg != '' && valida3 || escreveu)) {
      email.enviarEmail(req.body.Body)
      res.header("Content-Type", "text/xml").status(200);
      results.body("Sua mensagem foi enviada com sucesso para nosso email. Fique atento que em breve retornaremos.\nDigite voltar para ir para o menu")
      res.end(results.toString());

    } else if ((incomingWhatsappMsg == '5' && menu) || (incomingWhatsappMsg == '5' && voltar)) {
      const numero = req.body.From
      res.header("Content-Type", "text/xml").status(200);
      results.body('Digite voltar para ir para o menu')
      res.send(results.toString())
      res.end(quarto.envioDeQuartos(numero))
    }

    else if (valida2 == true && incomingWhatsappMsg != "" && incomingWhatsappMsg!="2") {
      const dados = req.body.Body
      console.log('valida 2' + valida2)
      await axios.delete("https://api-hotel-chatbot.herokuapp.com/cliente/" + dados)
      res.writeHead(200, { "Content-Type": "text/xml" });
      results.body("Sua Reserva foi cancelada.\nDigite *voltar* para acessar o menu.")
      res.end(results.toString());
    }

    else if (incomingWhatsappMsg == "nao" || incomingWhatsappMsg == "não" || (incomingWhatsappMsg == "não" && menu)) {
      res.writeHead(200, { "Content-Type": "text/xml" });
      results.body("Atendimento encerrado");
      res.end(results.toString());
    } else {
      res.writeHead(200, { "Content-Type": "text/xml" });
      results.body("Não consegui compreender, desculpe.  Digite *Voltar* para ir até o menu");
      menu = false;
      res.end(results.toString());
    }
  } catch (error) {
  }
});
app.listen(process.env.PORT || 8080, function () {
  console.log("Example app listening on port 3000!");
});


