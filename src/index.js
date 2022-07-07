const express = require('express')
const { v4:uuidv4 } = require('uuid')

const app = express()

app.use(express.json())

// banco de dados fake (dados em memória)

const customers = []

/*
    * cpf --> string
    * name --> string
    * id --> uuid
    * statement --> []

*/

// Middleware

function verifyIfExistsAccountCPF(request, response, next){
     //const { cpf } = request.params

    const { cpf } = request.headers
    const customer = customers.find((customer) => customer.cpf === cpf)

    if(!customer){
        return response.status(400).json({error: "Customer not found."})
    }
    request.customer = customer //aqui consigo passar informações atráves dos middlewares
    return next() //function que chama o próximo middleware
}

//app.use(verifyIfExistsAccountCPF) // <--- utilizando o middleware de forma global nas requisições

app.post("/account", (request, response) => {
    const { cpf, name } = request.body
    const customeresAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    )
    if (customeresAlreadyExists){
        return response.status(400).json({ error: "Customer already exists."})
    }
    customers.push({
        cpf,
        name,
        id: uuidv4(),
        statement: []
    })
    return response.status(201).send('Account created with success.')
})

// utilizando o middleware de forma específica

app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
   //const { cpf } = request.params
    const { customer } = request // capturando a informação enviada pelo middleware
    return response.json(customer.statement)
})

app.listen(3333)