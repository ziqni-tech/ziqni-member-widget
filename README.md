# Gamification UX package

HTML/CSS and Vanilla JavaScript Ziqni Leaderboard / Achievements / Inbox-Messaging widget

<p align="center">
    <img width="400" src="https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/docs/miniScoreBoard.gif"><br/>
</p>

Our widget "out of the box" is a product that you can use immediately by placing it on your existing game, on your website or include it into your Node project directly or anything that you need it to be used for. The widget is fully editable, re-adjustable, multilingual (all languages are supported), units of measure are also auto-generated by the system (all the currencies are pre defined in your private space) and it is a complementary product that gives the player a full in-depth gaming experience. All you have to do is:

[Read more here](https://ziqni.atlassian.net/wiki/spaces/CLRAV/pages/4761681923/The+Widget)

The widget is designed to work with the new ZIQNI platform APIs
- [Github](https://github.com/ziqni-tech/ziqni-member-sdks)
- [Docs](https://documentation.ziqni.com/member-api)
- [NPM SDK](https://www.npmjs.com/package/@ziqni-tech/member-api-client)

## Installation

The Leaderboard Widget package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:

```sh
npm install @ziqni-tech/member-widget
```

Or if you're using [yarn](https://classic.yarnpkg.com/en/docs/install/):

```sh
yarn add @ziqni-tech/member-widget
```

## Build

#### Prerequisites

- NodeJS >= 10.10
- NPM >= 6.x

Install the dependencies.

```sh
npm install
```

Run `npm run build` to generate production files inside `build`.

```sh
npm run build
```

You can include css file into the bundle by running one of the commands (images will also be compiled into base64 format):

```sh
npm run dev -- --inlineCss=true
npm run build -- --inlineCss=true
```

Or run `npm run dev` to build widget in development mode.

```sh
npm run dev
```

#### Coding standards

Code formatting rules are defined in `.eslintrc`. You can check your code against these standards by running:

```sh
npm run lint
```

To automatically fix any style violations in your code, you can run:

```sh
npm run lint -- --fix
```

#### Running tests

You can run the test suite using the following command:

```sh
npm run test
```

Run `npm run test:coverage` to open coverage report

```sh
npm run test:coverage
```

Please ensure that the tests are passing when submitting a pull request.

#### Documentation

You can generate documentation by running:

```sh
npm run jsdoc
```

#### Command parameters:
<table>
    <tr>
        <th align="left">Parameters</th>
        <th align="left">Value</th>
        <th align="left">Description</th>
        <th align="left">Example</th>
    </tr>
    <tr>
        <td>inlineCss</td>
        <td>yes/no</td>
        <td>Forces css to be compiled into the bundle</td>
        <td>--inlineCss=true</td>
    </tr>
    <tr>
        <td>theme</td>
        <td>[theme name]</td>
        <td>Tells the rendered what theme to package and render</td>
        <td>--theme=grey-theme-refresh</td>
    </tr>
</table>

## Examples
Running the project in dev mode will initialise with an example page.

<table style="border:none;">
    <tr>
        <td>
            <img width="250" src="https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/docs/1.png" />
        </td>
        <td>
            <img width="250" src="https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/docs/2.png" />
        </td>
        <td>
            <img width="250" src="https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/docs/3.png" />
        </td>
    </tr>
</table>


## Adding widget to your website
```js
import MemberWidget from '@ziqni-tech/member-widget';

const instance = new MemberWidget({
  autoStart: false,
  debug: false,
  apiKey: '<api_key>',
  memberRefId: '<member_reference_id>',
  loadCustomTranslations: true,
  enableNotifications: true,
  navigation: {
    tournaments: {enable: true},
    achievements: {enable: true},
    rewards: {enable: true},
    inbox: {enable: true},
    missions: {enable: true},
  },
  leaderboard: {
    fullLeaderboardSize: 100,
    miniScoreBoard: {
      rankingsCount: 2
    },
    pointsFormatter: function(points) {
      if (isNaN(points)) {
        return points;
      }
      return Math.round(points)
    }
  },
  uri: {
    translationPath: '<path to custom json translation file>'
  },
  callbacks: {
    onContestStatusChanged: function (contestId, currentState, previousState) {
      console.log('contestId:', contestId);
      console.log('currentState:', currentState);
      console.log('previousState:', previousState);
    },
    onCompetitionStatusChanged: function (competitionId, currentState, previousState) {
      console.log('competitionId:', competitionId);
      console.log('currentState:', currentState);
      console.log('previousState:', previousState);
    },
  },
  resources: [
    'node_modules/@ziqni-tech/member-widget/build/css/theme/default-theme.css'
  ]
});

instance.init();
```
### Or
```html
<script type="text/javascript">
	(function(w,d,s,u,o){
        w[o] = {
            apiKey: '<api_key>',
            memberRefId: '<member_reference_id>',
            language: "en",
            leaderboard: {
                fullLeaderboardSize: 50,
                topResultSize: 3,
                miniScoreBoard: {
                  rankingsCount: 2
                },
            },
            uri: {
                translationPath: ""
            },
            resources: [
                "https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/build/css/theme/cl-style-1-default-theme.css"
            ]
        };
        var a=d.createElement(s), m=d.getElementsByTagName(s)[0];
        a.async=1;a.src=u;m.parentNode.insertBefore(a,m);
    })(window,document,'script','https://ziqni.cdn.ziqni.com/ziqni-tech/ziqni-member-widget/build/javascript/ziqni-member-widget.js',"_CLLBV3Opt");
</script>
```
### Or
```html
  <script type="text/javascript" src="https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/build/javascript/ziqni-member-widget-selfinit.js"></script>

  <script type="text/javascript">
    const widgetInstance = new window._clLeaderBoardV3SelfInit({
      autoStart: false,
      debug: false,
      apiKey: '<api_key>',
      memberRefId: '<member_reference_id>',
      loadCustomTranslations: false,
      navigation: {
        tournaments: {enable: true},
        achievements: {enable: true},
        rewards: {enable: true},
        inbox: {enable: true},
        missions: {enable: true},
      },
      leaderboard: {
        fullLeaderboardSize: 50,
        miniScoreBoard: {
          rankingsCount: 2
        },
        pointsFormatter: function(points) {
          if (isNaN(points)) {
            return points;
          }
          return Math.round(points)
        }
      },
      resources: [
        "https://ziqni.cdn.ziqni.com/ziqni-tech/MemberWidgetV2/build/css/theme/cl-style-1-default-theme.css"
      ]
    });

    widgetInstance.init();
  </script>
```

## Using the loader script
You can use this loader script to centralise all your widget loading needs (custom scripts, styles and environmental parameters) into a single place.
The "Loader" script requires the bear minimum of 2 things to be set to the global `window._CLLBV3Opt` parameter before the scripts loads:
1) `gameId`
2) `memberId`
```html
<script type="text/javascript">
    window._CLLBV3Opt = {
        gameId: "my_game_id",
        memberId: "my_member_id"
    };
</script>
```
#### Steps required to configure the loader script:
1) update your default API key, space name (optional: `language` and `currency`), unless you are loading the API key and space name from your game/product
2) define what products will load in the widget:
```javascript
products: {
    "my_product_id": {
        script: "https://my.custom.script.location",
        resources: [
            "https://my.custom.stylesheet.location"
        ],
        onBeforeLoad: function( instance, options, callback ){ // your custom logic before the widget gets initialised/rendered
            if( typeof callback === "function" ) callback();
        }
    },
    "my_product_id_2": {}
}
```
3) add loader script to your website


## FAQ
### How do I set the currency:
The setting "currency" needs to be set to the appropriate ISO key used in units of measure section
```text
{
  currency: "usd"
}
```

### How do I specify a custom stylesheet:
All styles are loaded as part of the initialisation, so overwriting the resources array variable with your stylesheet asset will allow you to load in the external stylesheets dynamically.
There is no limit to how many stylesheets you can add as the widget will load all of them from the specified array.

### How to show game/product specific competitions only:
```text
The setting "enforceGameLookup" should be set to "true" and game/product ID should be assigned to the setting entry "gameId" part of the widget startup/initialisation
{
  enforceGameLookup: true,
  gameId: "my_id"
}
```

### How to disable Tournaments, Achievements, Rewards, or Inbox tabs:
```text
To disable Tournaments, Achievements, Rewards, or Inbox tabs on the full widget preview the following settings has to be set to "false":

navigation: {    
  tournaments: {enable: false},
  achievements: {enable: false},
  rewards: {enable: false},
  inbox: {enable: false},
},

Note: at least one tab should be left enabled
```

### How to disable Inbox/Messaging section:
```text
To disable the inbox/messaging area on the full widget preview the following setting "messages.enabled" has to be set to "false":
{
  messages: {
      enable: false
  }
}
```

### How to show the widget only if there are any available competitions:
```text
The primary method “this.startup“ inside the "LbWidget" class is the one you should adjust to implement your scenario to achieve a pre-launch check, you can wrap what's inside of that method with the function:
this.checkForAvailableCompetitions()
This method collects all the necessary information about active, ready and finished competitions (example: _this.settings.tournaments.readyCompetitions will contain a list of upcoming competitions) so you can use the callback and the collected information to decide to show or hide the mini-scoreboard on startup based on your requirements.
```

### How do I only show the competition tab if there is an active competition only and/or change the default tab to the achievements tab

The current flow is:
1) once the mini scoreboard is clicked, the main layout gets initialized (unless it’s already not existing in the DOM)
2) the navigation then gets reset to the initial competition tab

To achieve this scenario you would need to do an available competition check prior to the navigation reset and then hide/show tabs accordingly based on your business requirement.
The code of interest would be on line inside the method called: "this.initLayout" in the "MainWidget" widget class, the method that resets the navigation is "_this.resetNavigation( callback )" this handles what navigation item to set as default for the user.
You can either change this code directly or override that method after initialization inside the "this.startup" method for the class "LbWidget" by doing the following "_this.settings.mainWidget.resetNavigation = function(callback){}". 
There you can write some logic that would check what tabs to show/hide. 
Or you can overwrite this on a more global scope level where you initialize the widget "new LbWidget(window._CLLBV3Opt)" as you get full access to the settings and all other methods.


### Localization - How do I translate the widget UI:
To enable translation the following steps need to be made:
1) Translate your UI elements to the appropriate language and save it in a ".json" format using the following naming pattern `translation_en.json` [JSON example](https://ziqni.cdn.ziqni.com/ziqni-tech/gamification-ux-package/_widgets/gamification-ux-package/i18n/translation_en.json)
2) The translations you define inside the file will be merged with the core translations on run time

```text
* The default widget language is set to english "en", the widget will try to load look for an external translation 
resource based on the language setting and the "translationPath"

* If the resource path is used as "translation_:language.json" the widget script will try to replace ":language" with the 
current language  setting and load the translation dynamically from an external source, example:
https://ziqni.cdn.ziqni.com/ziqni-tech/gamification-ux-package/_widgets/gamification-ux-package/i18n/translation_:language.json

* If translations are not required it is possible to disable them by changing "loadTranslations" setting to "false"
```

### Why we use SASS:
Here are some of the basic benefits of why we are using SASS:
* provides the ability to use variables, allows you to store a value, or a set of values, and to reuse these variables throughout your SASS files as many times you want and wherever you want. Easy, powerful, and useful.
* the improved syntax allows you to use a nested syntax, which is code contained within another piece of code that performs a wider function
* provides mixin functionality: Mixins are like functions in other programming languages. They return a value or set of values and can take parameters including default values.
* allows you to break apart your big complex CSS files into smaller chunks, this improves the ability to work on the same stylesheets for multiple teams
* still supports the basic CSS syntax as SCSS syntax is CSS compatible

### IE11 support
Internet explorer 11 support is limited, at the moment styling and one of the libraries will need to be adjusted for full IE11 support which will require a review and update on the code where necessary.
To get the code to compile we recommend to:
1) inside the `src/javascript/modules/LbWidget.js` to remove/change the `import jsSHA from 'jssha'` import to the local library `import jsSHA from '../utils/jsSHA'`
2) inside the method `populateIdenticonBase64Image` update the jsSHA implementation from:
```javascript
var shaObj = new jsSHA('SHA-512', 'TEXT');
shaObj.update(str);
var hash = shaObj.getHash('HEX', 1);
``` 
to:
```javascript
var shaObj = new jsSHA(str, 'TEXT');
var hash = shaObj.getHash('SHA-512', 'HEX', 1);
```
