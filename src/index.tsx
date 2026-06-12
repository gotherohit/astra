// "render" is an Ink function that boots up a React app in the terminal
// It is equivalent of ReactDOM.render() in a browser app

import { render } from 'ink';

// createElement is a React's way of creating Component instance
// writing <App /> in JSX is exactly same the same as createElement(App)
// We use createElement here to show what jsx actually compiles to

import { createElement } from 'react';

// Our root componenet 

import { App } from './App.js';

async function main() {

	// render() starts the Ink app in Terminal and returns control handles 
	// { waitUntilExit } is destructuring - we pull that one property out of the object returned by render()
	const { waitUntilExit } = render(createElement(App));

	// waitUntilExit() returns a promise that gets resolved only when we type Ctrl+c, the effect is it stops the execution of the function main() unntil we press ctrl+c resulting in app not exiting  imeediately after render() returns. Node process remains alive and app is running. 
	await waitUntilExit();

 }

 main();
