![Image](https://raw.github.com/pboyer/flood/master/extra/screenshot.png) 


##flood

###What is it?

flood is a [dataflow](http://en.wikipedia.org/wiki/Dataflow_programming)-style visual programming language based on Scheme that runs on JavaScript.  It is based on the [Dynamo](http://github.com/ikeough/Dynamo) visual programming language.  flood runs in a browser and as a standalone application on all platforms via [node-webkit](https://github.com/rogerwang/node-webkit).  

As an interactive visual programming environment, flood allows the user to search for nodes, drag and select nodes, make connections between nodes, and get feedback about data as it is transformed through the graph.  flood, like Dynamo, is based on Scheme and provides "visual syntactic sugar" for partial function application.  It uses a [lightweight scheme interpreter](http://github.com/pboyer/scheme.js) to evaluate the graph and caches values on a per node basis by storing dirty state.  Unlike Dynamo, flood currently does not have automapping functionality.

flood is bundled with a library of nodes for [csg.js](http://evanw.github.io/csg.js/) and basic arithmetic.  


###Use it now!

[flood on the web](http://floodlang.com.s3-website-us-west-2.amazonaws.com)

[flood for Mac](http://floodlang.com.s3-website-us-west-2.amazonaws.com/releases/flood/flood-mac.zip)

[flood for Windows](http://floodlang.com.s3-website-us-west-2.amazonaws.com/releases/flood/flood-windows.zip)


###Getting started

flood is scaffolded with [Yeoman](http://yeoman.io/), uses [Grunt](http://gruntjs.com/) for task management and [Bower](http://bower.io/) for web package management.  flood uses [require.js](http://requirejs.org/) to manage dependencies between JavaScript files and [backbone.js](http://backbonejs.org/) to stick it all together.  If you're not familiar with these tools, you should take a look at the docs and get them installed.  


####Installing dependencies

To install all of the dependencies for flood, do:

	bower install
	npm install

This will install all of the development dependencies for Grunt and all of the public dependencies with bower.

####Running a server

This will start a HTTP server serving up the app directory and start your favorite web browser.  This also starts live-reload to watch the directory for changes and automatically reload the browser on change.

	grunt server

####Building for the web

The entire app can be compressed into lightweight, minified, and concatenated css, js, and html files using Grunt:

	grunt 

####Building for the desktop

flood can be used as a standalone application via node-webkit.  Just do this:

	grunt desktop

This will generate binaries for use on Mac and Windows in the dist_desktop folder.


###License

The MIT License (MIT)

Copyright (c) Peter Boyer 2013

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

