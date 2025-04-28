import markdownIt from 'markdown-it';
import attrs from 'markdown-it-attrs';

const markdownLibrary = markdownIt({
  html: true,
  breaks: false,
  linkify: true
}).use(attrs);

export default markdownLibrary;