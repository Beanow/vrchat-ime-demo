# vrchat-ime-demo
Example code of how to build a Japanese IME in VRChat

**Test it using https://beanow.github.io/vrchat-ime-demo/**

Press [TAB] or [\`] to switch input mode.<br>
Press [SPACE] to cycle through IME suggestions (JP only).<br>
Press [ENTER] to use the highlighted suggestion (JP only).<br>
Press [ENTER] again to send the message.<br>
Press [DEL] to remove the previous message.<br>
Be sure to test <code>javascript:key('a')</code> too.

[Based on the great work done before me.](https://qiita.com/katanov/items/8a7aed9a92c77528602f)<br>
[And this library finding out how to use the APIs.](https://bitbucket.org/purohit/jquery.intlkeyboard.js)

3rd party libraries being used:
- https://www.google.com/inputtools/ getting IME style suggestions.
- _Note: I have not found clear terms for using: `https://inputtools.google.com`, so I'm not sure using it this way is allowed by Google._
- [jQuery slim 3.3.1](https://jquery.com/download/) for rendering elements and binding events.
- [WanaKana.js 4.0.1](https://github.com/WaniKani/WanaKana/releases) for converting qwerty input to hiragana.
