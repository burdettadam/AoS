#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// List of character IDs to download artwork for
const characters = [
  'acrobat', 'al-hadikhia', 'alchemist', 'alsaahir', 'amnesiac', 'angel', 'apprentice', 'artist', 'assassin', 'atheist',
  'balloonist', 'banshee', 'barber', 'barista', 'beggar', 'bishop', 'boffin', 'bone-collector', 'boomdandy', 'bootlegger',
  'bounty-hunter', 'buddhist', 'bureaucrat', 'butcher', 'cacklejack', 'cannibal', 'cerenovus', 'chambermaid', 'choirboy',
  'clockmaker', 'courtier', 'cult-leader', 'damsel', 'deus-ex-fiasco', 'deviant', 'devils-advocate', 'djinn', 'doomsayer',
  'dreamer', 'duchess', 'engineer', 'evil-twin', 'exorcist', 'fang-gu', 'farmer', 'fearmonger', 'ferryman', 'fibbin',
  'fiddler', 'fisherman', 'flowergirl', 'fool', 'gambler', 'gangster', 'gardener', 'general', 'gnome', 'goblin',
  'godfather', 'golem', 'goon', 'gossip', 'grandmother', 'gunslinger', 'harlot', 'harpy', 'hatter', 'hells-librarian',
  'heretic', 'hermit', 'high-priestess', 'huntsman', 'innkeeper', 'judge', 'juggler', 'kazali', 'king', 'klutz',
  'knight', 'legion', 'leviathan', 'lil-monsta', 'lleech', 'lord-of-typhon', 'lunatic', 'lycanthrope', 'magician',
  'marionette', 'mastermind', 'mathematician', 'matron', 'mezepheles', 'minstrel', 'moonchild', 'mutant', 'nightwatchman',
  'no-dashii', 'noble', 'ogre', 'ojo', 'oracle', 'organ-grinder', 'pacifist', 'philosopher', 'pit-hag', 'pixie',
  'plague-doctor', 'po', 'politician', 'poppy-grower', 'preacher', 'princess', 'professor', 'psychopath', 'pukka',
  'puzzlemaster', 'revolutionary', 'riot', 'sage', 'sailor', 'savant', 'scapegoat', 'seamstress', 'sentinel', 'shabaloth',
  'shugenja', 'snake-charmer', 'snitch', 'spirit-of-ivory', 'steward', 'storm-catcher', 'summoner', 'sweetheart',
  'tea-lady', 'thief', 'tinker', 'town-crier', 'toymaker', 'vigormortis', 'village-idiot', 'vizier', 'vortox', 'voudon',
  'widow', 'witch', 'wizard', 'wraith', 'xaan', 'yaggababble', 'zealot', 'zombuul'
];

const baseUrl = 'https://ryanascherr.github.io/botc/img/';
const outputDir = path.join(__dirname, 'artwork', 'characters');

console.log('Downloading character artwork...\n');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let downloaded = 0;
let failed = 0;

characters.forEach(characterId => {
  const url = `${baseUrl}${characterId}.png`;
  const outputPath = path.join(outputDir, `${characterId}.png`);

  // Skip if file already exists
  if (fs.existsSync(outputPath)) {
    console.log(`✓ ${characterId}.png already exists`);
    downloaded++;
    return;
  }

  https.get(url, (response) => {
    if (response.statusCode === 200) {
      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        console.log(`✓ Downloaded ${characterId}.png`);
        downloaded++;
        checkComplete();
      });
    } else {
      console.log(`✗ Failed to download ${characterId}.png (${response.statusCode})`);
      failed++;
      checkComplete();
    }
  }).on('error', (err) => {
    console.log(`✗ Error downloading ${characterId}.png: ${err.message}`);
    failed++;
    checkComplete();
  });
});

function checkComplete() {
  if (downloaded + failed === characters.length) {
    console.log(`\nDownload complete!`);
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${characters.length}`);
  }
}
