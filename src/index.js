const express = require('express')
const { v4: uuidv4 } = require('uuid')

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

function verifyIfExistsAccountCPF(request, response, next) {
    //const { cpf } = request.params

    const { cpf } = request.headers
    const customer = customers.find((customer) => customer.cpf === cpf)

    if (!customer) {
        return response.status(400).json({ error: "Customer not found." })
    }
    request.customer = customer //aqui consigo passar informações atráves dos middlewares
    return next() //function que chama o próximo middleware
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === "credit") {
            return acc + operation.amount // pega o valor atual e soma com o valor do statement
        } else {
            return acc - operation.amount // pega o valor atual e subtrai com o valor do statement
        }
    }, 0)
    return balance
}

//app.use(verifyIfExistsAccountCPF) // <--- utilizando o middleware de forma global nas requisições

app.post("/account", (request, response) => {
    const { cpf, name } = request.body
    const customeresAlreadyExists = customers.some(
        (customer) => customer.cpf === cpf
    )
    if (customeresAlreadyExists) {
        return response.status(400).json({ error: "Customer already exists." })
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

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body
    const { customer } = request
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }
    customer.statement.push(statementOperation)
    return response.status(201).json({ msg: "Deposit made successfully." })
})

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body
    const { customer } = request

    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).json({ error: "Insufficient funds." })
    }
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }
    customer.statement.push(statementOperation)
    return response.status(201).json({ msg: "Withdraw made successfully." })
})

app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    const { date } = request.query
    const dateFormated = new Date(date + " 00:00")
    const statement = customer.statement.filter((statement) =>
        statement.created_at.toDateString() ===
        new Date(dateFormated).toDateString()
    )
    return response.json(statement)

})

app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    const { name } = request.body
    customer.name = name

    return response.status(201).json({msg: "Name was upated."})
})

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request
    return response.json(customer)
})
app.listen(3333)