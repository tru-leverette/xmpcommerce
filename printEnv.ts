// Temporary script to print all environment variables for debugging
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

console.log('Loaded environment variables:');
for (const [key, value] of Object.entries(process.env)) {
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
        console.log(`${key}: [HIDDEN]`);
    } else {
        console.log(`${key}: ${value}`);
    }
}

console.log('\nOPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '[SET]' : '[NOT SET]');
