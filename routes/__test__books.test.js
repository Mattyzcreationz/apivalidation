process.env.NODE_ENV = 'test'

const { describe, afterEach } = require('node:test');
const app  = require('../app');
const db = request('../db');
const request = require('supertest');
const { title, hasUncaughtExceptionCaptureCallback } = require('process');
const { appendFileSync } = require('fs');
const { markAsUntransferable } = require('worker_threads');

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
    VALUES   (
        '565656', 
        'https://amazon.com/taco',
        'Elie', 
        'English', 
        100, 
        'Nothing publishers', 
        'my first book', 2008)
        RETURNING isbn)`);
        book_isbn = result.rows[0].isbn
});

describe('POST /books', function(){
    test('Creates book', async function (){
        const response = await request(app)
        .post('/books')
        .send({
            isbn: '2382738', 
            amazon_url: 'https://taco.com',
            author: 'mctest',
            language: 'english',
            pages:1000,
            publisher: 'mhm',
            title: 'Title of the wat ever',
            year: '2000'
        });
        test('no titel no book', async function (){
            const response = await request(app)
            .post('/books')
            .send({year: 200});
        expect(response.statusCode).toBe(400);
        });
    });
    describe('GET /books', function(){
        test('list of books', async function (){
            const response = await request(app).get('/books');
            const books = response.body.books;
            expect(books).toHaveLength(1);
            expect(books[0]).toHaveProperty('isbn');
            expect(books[0]).toHaveProperty('amazon_url');
        });
    });
    test('Respondes 404', async function (){
        const response = await request(app)
        .get('/books/999')
    expect(response.statusCode).toBe(404);
    });
});

describe('PUT /books/:id', function(){
    test('Updates a single book', async function (){
        const response = await request(app)
        .put('/books/${book_isbn')
        .send({
            amazon_url: 'https://taco.com',
            author:'mctest',
            language: 'english',
            page:1000,
            publisher: 'yeah right',
            title: 'update book',
            year: 2000
        });
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.title).toBe('UPDATE BOOK');
    });
    test('Prevents a bad book update', async function(){
        const response = await request(app)
        .put('/books/${book_isbn}')
        .send({
            isbn: '45421',
            badField: 'cant ', 
            amazon_url: 'https://taco.com',
            author:'mctest',
            language:'english',
            page:1000,
            publisher: 'yeah right',
            title: 'update',
        });
        expect(response.statusCode).toBe(400);
    });
    test('reponses 404 error code', async function (){
        await request(app)
            .delete('/books/${book_isbn}')
        const response = await request(app).delete('/books/${book_isbn}');
        expect(response.statusCode).toBe(404);
    });
});

describe('Delete /books/:id', function(){
    test('delete', async function (){
        const reponse = await request(app)
        .delete('/book/${book_isbn}')
    expect(response.body).toEqual({message: 'book'});
    });
});

afterEach(async function (){
    await db.query('delte from books');
});

afterAll(async function(){
    await db.end();
});