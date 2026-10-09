import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');

async function regenerateSessions() {
  try {
    await pb.admins.authWithPassword('masha0042912@gmail.com', 'Vasileva.111');
    console.log('✅ Авторизация успешна');

    // 1. Получаем все данные
    const movies = await pb.collection('movies').getFullList();
    const halls = await pb.collection('halls').getFullList();
    const cinemas = await pb.collection('cinemas').getFullList();

    console.log(` Фильмов: ${movies.length}`);
    console.log(`🎭 Залов: ${halls.length}`);
    console.log(`🎬 Кинотеатров: ${cinemas.length}`);

    // 2. Удаляем старые сеансы
    const oldSessions = await pb.collection('sessions').getFullList();
    console.log(`️ Удаляю ${oldSessions.length} старых сеансов...`);
    for (const session of oldSessions) {
      await pb.collection('sessions').delete(session.id);
    }

    // 3. Генерируем новые сеансы с правильными ID
    const formats = ['2D', '3D', 'IMAX'];
    const times = ['10:00', '13:30', '16:00', '19:30', '22:00'];
    let count = 0;

    console.log('\n🎬 Генерирую новые сеансы...');
    for (const movie of movies) {
      console.log(`  Фильм: ${movie.title} (ID: ${movie.id})`);
      
      for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        for (const time of times) {
          const format = formats[Math.floor(Math.random() * formats.length)];
          
          // Выбираем зал: IMAX -> зал 2, остальные -> зал 1
          const hall = halls.find(h => 
            format === 'IMAX' ? h.name.includes('IMAX') : !h.name.includes('IMAX')
          );
          
          if (!hall) {
            console.warn(`  ⚠️ Зал не найден для формата ${format}`);
            continue;
          }

          let basePrice = 350;
          if (format === '3D') basePrice = 450;
          if (format === 'IMAX') basePrice = 600;

          const hour = parseInt(time.split(':')[0], 10);
          if (hour >= 18) basePrice += 100;

          await pb.collection('sessions').create({
            movieId: movie.id,
            date: dateStr,
            time: time,
            format: format,
            hallId: hall.id,
            price: basePrice
          });
          count++;
        }
      }
    }

    console.log(`\n Готово! Создано ${count} сеансов.`);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

regenerateSessions();