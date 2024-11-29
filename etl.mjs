import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// MongoDB connection string
const mongoUri = process.env.MONGO_URI;

async function extract() {
  const connection = await mysql.createConnection(mysqlConfig);
  try {
    console.log('Extracting data from MySQL...');
    const [rows] = await connection.execute('SELECT title, body FROM articles');
    return rows;
  } finally {
    await connection.end();
  }
}

function transform(data) {
  console.log('Transforming data...');
  return data.map(article => ({
    ...article,
    articleDesc: `${article.title} ${article.body}`,
    createdAt: new Date()
  }));
}

async function load(data) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('etl_demo');
    const collection = db.collection('articles');

    console.log('Loading data into MongoDB...');
    const result = await collection.insertMany(data);
    console.log(`${result.insertedCount} documents inserted.`);
  } finally {
    await client.close();
  }
}

async function runETL() {
  try {
    const extractedData = await extract();
    const transformedData = transform(extractedData);
    await load(transformedData);
    console.log('ETL process completed successfully.');
  } catch (error) {
    console.error('Error in ETL process:', error);
  }
}

runETL();