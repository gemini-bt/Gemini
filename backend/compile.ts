import path from 'node:path';
import db from './db';
import fs from 'fs/promises';

import { JSDOM } from 'jsdom';

export async function compile(id: string) {
    const competition = await db.competition.findFirst({
        where: {
        id,
        },
    });
    
    if (!competition) {
        return;
    }

    const template = await fs.readFile(path.join(__dirname, '../', '/public/editor.html'), 'utf-8');

    const dom = new JSDOM(template, {contentType: 'text/html'});

    const newDom = new JSDOM("<!DOCTYPE html><html><head></head><body></body></html>", {contentType: 'text/html'});

    const document = dom.window.document;
    const newDocument = newDom.window.document;

    document.querySelectorAll('head > *').forEach(node => {
        if (node.hasAttribute('data-exclude')) {
            return;
        }

        newDocument.head.appendChild(node.cloneNode(true));
    });

    var content = document.querySelector('.content');

    if (content) {
        content.classList.remove('flex-row');
        content.classList.add('flex-col');
        content.classList.add('p-4');
        newDocument.body.appendChild(content.cloneNode(false));
    }
    
    var contents = document.querySelectorAll('.right-section > *');

    contents.forEach(node => {
        if (node.hasAttribute('data-exclude')) {
            return;
        }

        newDocument.querySelector('.content')!.appendChild(node.cloneNode(true));
    });

    newDocument.getElementById('preview-banner')!.style.backgroundImage = "url('" + competition.banner + "')";
    // newDocument.getElementById('preview-banner-blur')!.style.backgroundImage = "url('" + competition.banner + "')";
    newDocument.getElementById('preview-title')!.textContent = competition.name;
    newDocument.getElementById('preview-summary')!.textContent = competition.description;
    newDocument.getElementById('preview-author-name')!.textContent = competition.organizer;
    newDocument.getElementById('preview-author-email')!.textContent = competition.contact;
    newDocument.getElementById('preview-author-image')!.setAttribute('src', competition.authorImg || '');
    newDocument.getElementById('preview-rules')!.textContent = competition.rules;
    newDocument.getElementById('preview-prizes')!.textContent = competition.prizes;

    document.querySelectorAll('body > script').forEach(node => {
        if (node.hasAttribute('data-exclude')) {
            return;
        }

        newDocument.body.appendChild(node.cloneNode(true));
    });

    await fs.mkdir(__dirname + `/compiled/${id}`, { recursive: true });
    await fs.writeFile(__dirname + `/compiled/${id}/index.html`, newDocument.documentElement.outerHTML);

    return true;
}