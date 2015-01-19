
# metalsmith-templates

  A metalsmith plugin to render files with templates.

  You can use any templating engine supported by [consolidate.js](https://github.com/visionmedia/consolidate.js).

## Installation

    $ npm install metalsmith-templates

## CLI Usage

  Install the node modules and then add the `metalsmith-templates` key to your `metalsmith.json` plugins. The simplest use case just requires the template engine you want to use:

```json
{
  "plugins": {
    "metalsmith-templates": "handlebars"
  }
}
```

  If you want to specify additional options, pass an object:

```json
{
  "plugins": {
    "metalsmith-templates": {
      "engine": "handlebars",
      "directory": "templates"
    }
  }
}
```

## Javascript Usage

  For the simplest use case, just pass your templating engine:

```js
var templates = require('metalsmith-templates');

metalsmith.use(templates('swig'));
```

  To specify additional options:

```js
metalsmith.use(templates({
  engine: 'swig',
  directory: 'templates'
}));
```

## Partials
*Partials* are smaller fragments of templates, in `handlebars` these can be defined as in the example below: 
```js
metalsmith.use(templates({
  engine: 'handlebars',
  directory: 'templates',
  partials: {
    footer: 'partials/footer',
    header: 'partials/header',
    post: 'partials/post',
  }
}));
```

The partials will exist in the directory pointed to by `directory`. The `footer` partial will have the path `templates/partials/footer.html`.

Now these partials could be used with `handlebars` like this
```
{{>footer}}
```

## License

  MIT