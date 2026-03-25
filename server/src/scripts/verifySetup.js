/**
 * Verificación completa del setup de Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SUPABASE_URL = 'https://nubiecwypgfekhvaffxm.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51YmllY3d5cGdmZWtodmFmZnhtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQwODEyNCwiZXhwIjoyMDg5OTg0MTI0fQ.yJVMLIPSs2llvTh2UHMyIHmT9NJkC80yEfhgIetgwo4';
const GEMINI_API_KEY = 'AIzaSyD3LOshQxEY4swacCat1VnlVuGj8WviWAU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifySetup() {
  console.log('🔍 Verificando configuración de Supabase...\n');
  
  let allOk = true;

  // 1. Verificar tablas
  console.log('1️⃣  Verificando tablas:');
  const tables = ['insurers', 'documents', 'page_images', 'chunks', 'analysis_history'];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        allOk = false;
      } else {
        console.log(`   ✅ ${table}`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: Error de conexión`);
      allOk = false;
    }
  }

  // 2. Verificar bucket
  console.log('\n2️⃣  Verificando Storage:');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) throw error;
    
    const clauseBucket = buckets.find(b => b.name === 'clause-pages');
    if (clauseBucket) {
      console.log('   ✅ Bucket "clause-pages" existe');
    } else {
      console.log('   ❌ Bucket "clause-pages" no encontrado');
      allOk = false;
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    allOk = false;
  }

  // 3. Verificar Gemini
  console.log('\n3️⃣  Verificando Gemini API:');
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result = await embeddingModel.embedContent('test de conexión');
    
    if (result.embedding && result.embedding.values.length > 0) {
      console.log(`   ✅ Gemini API funcionando (${result.embedding.values.length} dimensiones)`);
    } else {
      console.log('   ⚠️  Respuesta inesperada de Gemini');
      allOk = false;
    }
  } catch (e) {
    console.log(`   ❌ Error Gemini: ${e.message}`);
    allOk = false;
  }

  // 4. Verificar tesauro
  console.log('\n4️⃣  Verificando tesauro:');
  try {
    const fs = require('fs');
    const path = require('path');
    const thesaurusPath = path.join(__dirname, '../data/thesaurus.json');
    const thesaurus = JSON.parse(fs.readFileSync(thesaurusPath, 'utf-8'));
    
    const coberturas = Object.keys(thesaurus.coberturas_plantilla);
    console.log(`   ✅ Tesauro cargado: ${coberturas.length} coberturas`);
    console.log(`   📚 Version: ${thesaurus.version}`);
    console.log(`   🌎 Región: ${thesaurus.metadata.region}`);
    console.log(`   💰 SMMLV: $${thesaurus.metadata.salary_value_2024.toLocaleString()}`);
  } catch (e) {
    console.log(`   ❌ Error cargando tesauro: ${e.message}`);
    allOk = false;
  }

  // 5. Prueba de inserción
  console.log('\n5️⃣  Probando inserción (aseguradora de prueba):');
  try {
    const { data, error } = await supabase
      .from('insurers')
      .insert({ name: 'Aseguradora Test', nit: '123456789' })
      .select();
    
    if (error) {
      console.log(`   ⚠️  ${error.message}`);
    } else {
      console.log(`   ✅ Inserción exitosa (ID: ${data[0].id})`);
      
      // Limpiar
      await supabase.from('insurers').delete().eq('id', data[0].id);
      console.log('   🗑️  Datos de prueba eliminados');
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
    allOk = false;
  }

  // Resumen
  console.log('\n' + '='.repeat(50));
  if (allOk) {
    console.log('✅ ¡TODO CONFIGURADO CORRECTAMENTE!');
    console.log('\nEl sistema está listo para:');
    console.log('  • Indexar documentos PDF');
    console.log('  • Generar embeddings con Gemini');
    console.log('  • Almacenar imágenes de páginas');
    console.log('  • Realizar búsquedas semánticas');
    console.log('\n🚀 Puedes empezar a usar el sistema.');
  } else {
    console.log('⚠️  ALGUNOS PROBLEMAS DETECTADOS');
    console.log('\nRevisa los errores arriba.');
  }
  console.log('='.repeat(50));
  
  return allOk;
}

verifySetup().then(ok => process.exit(ok ? 0 : 1));
