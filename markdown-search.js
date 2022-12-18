import lunr from 'lunr';
import { existsSync, promises } from 'node:fs';
import { join } from 'path';
import { homedir } from 'os';
import cliMd from 'cli-markdown';
import pager from 'node-pager';

async function* walk(dir, ignore) {
  try {
    for await (const d of await promises.opendir(dir)) {
      const entry = join(dir, d.name);
      if (d.isDirectory()) {
        if (ignore.indexOf(d.name) != -1) {
          continue;
        }
        yield* walk(entry, ignore);
      } if (d.isFile() && d.name.endsWith('.md')) {
        yield entry;
      }
    }
  } catch {
    console.log('Could not walk ' + dir);
  }
}

async function buildIndex(mdsDirectories, mdsIndexFile) {
  let documents = [];
  for (let mdsDirectory of mdsDirectories) {
    for await (const p of await walk(mdsDirectory, ['.git'])) {
      if (p.indexOf('index.json') != -1) {
        continue;
      }
      documents.push({ name: p, text: await promises.readFile(p) });
    }
  }

  let index = lunr(function () {
    this.ref('name');
    this.field('text');

    documents.forEach(function (doc) {
      this.add(doc)
    }, this)
  });

  await promises.writeFile(mdsIndexFile, JSON.stringify(index));

  return index;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let refresh = false;
  let query = '';

  if (args[0] == '-r') {
    refresh = true;
    query = args.slice(1).join(' ');
  } else {
    query = args.join(' ');
  }

  return { 'refresh': refresh, 'query': query }
}

async function getDirectories(mdsDirectory) {
  try {
    let config = JSON.parse(await promises.readFile(mdsDirectory + '/config.json'))
    return config['directories'];
  } catch {
    return [homedir() + '/mds', homedir() + '/notes'];
  }
}

async function main(args) {
  let mdsDirectory = homedir() + '/.mds';
  if (!existsSync(mdsDirectory)) {
    await promises.mkdir(mdsDirectory);
  }

  let mdsIndexFile = mdsDirectory + '/index.json';

  if (args.refresh || !existsSync(mdsIndexFile)) {
    await buildIndex(await getDirectories(mdsDirectory), mdsIndexFile);
  }

  const index = lunr.Index.load(JSON.parse(await promises.readFile(mdsIndexFile)));

  const results = index.search(args.query);

  const markdown = [];
  for (const result of results) {
    try {
      markdown.push(await promises.readFile(result['ref'], 'utf8'));
    } catch {}
  }

  pager(cliMd(markdown.join('\n--- \n')));
}

main(parseArgs());