//importar dependencias

import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

//cargar configuración (apikey)
dotenv.config();

//Cargar express

const app = express();
const PORT = process.env.PORT || 3000;

//servir frontend

app.use("/", express.static("public"));

//Middleware para procesar json

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Instancia de openai y pasar apikey

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Ruta / endpoint / url

const context = `
        Eres un asistente de soporte para el supermercado "IA Market".
        Información del negocio:
            - Ubicación: Calle de la pantomima, nº 7, Madrid.
            - Horario: Lunes a Sabado de 8:00 a 21:00, Domingos de 9:00 a 18:00.
            - Productos: Pan, Leche, Frutas, Verduras, Carnes, Pescados, Congelados y Bebidas.
            - Marcas: Pascual, Kaiku, Hacendado, Centrar Lechera Asturiana, Cocacola, Fanta.
            - Metodos de pago: Efectivo, tarjeta y bizum.
        Solo puedes responder preguntas sobre la tienda. Cualquier otra cosa está prohibida.
    `;

    let conversations = {};

    app.post("/api/chatbot", async(req, res) =>{

    

    // Recibir pregunta del usuario
    const { userId, message } = req.body;
    if (!message) return res.status(404).json({error: "Has mandado un mensaje vacio"});

    if(!conversations[userId]){
        conversations[userId] = [];
    }

    conversations[userId].push({ role: "user", content: message});

    // Petición al modelo de inteligencia artificial
    try{

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", 
            messages: [
                { role: "system", content: context},
                { role: "system", content: "Debes responder de la forma más humana, mensajes cortos  y de forma directa posible, usando los mínimos tokens posibles"},
                ...conversations[userId]
            ],
            max_tokens: 200
        });

    // Devolver respuesta al usuario
    const reply = response.choices[0].message.content;

    //Añadir al asistente la respuesta
    conversations[userId].push({role: "assistant", content: reply});

    //limitar numero de mensajes

    if (conversations[userId].ledght >12){
        conversations[userId] = conversations[userId].slice(-10)
    }

    return res.status(200).json({reply});

    }catch(error){
        console.log("Error:", error);
        return res.status(500).json({error: "Error al generar la respuesta"});
    }
 });


//Servir el bakend
app.listen(PORT, () => {
    console.log("Servidor corriendo correctamente en el http://localhost:" + PORT);
});