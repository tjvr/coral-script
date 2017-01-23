# Monzo API Boilerplate

This is a minimal JavaScript web app that can be used for getting started with the [Monzo API](https://monzo.com/docs/). It's built using [Node.js](https://nodejs.org/en/), [Express](http://expressjs.com) and [Pug](https://pugjs.org/api/getting-started.html).

The app simply lists your transactions after prompting you to login via OAuth.

To make your own editable copy just do the following:

1. In another window sign into https://developers.getmondo.co.uk
1. Go to **Clients** > **New OAuth Client**
1. Enter **Name**, **Description** and choose **Not Confidential**
1. **Submit** then click on the name of your newly created client
1. Open a second copy of this page and click **Remix this** at the top
1. Click on `.env` in the sidebar and paste in your Monzo **Client ID** and **Client Secret**
1. Click on your project name at the top-left, click **copy** and paste into `ROOT_URL`
1. Set `SESSION_SECRET` to a [random string](https://www.random.org/strings/?num=1&len=8&digits=on&upperalpha=on&loweralpha=on&unique=on&format=html&rnd=new)
1. Click on **Show** at the top of the page
1. Log in and see your transactions!

You can then edit `index.pug` and `server.js` to your heart's content. The following are left as exercises:

1. Error handling ;)
1. Using an existing [Monzo API client library](https://github.com/rdingwall/awesome-monzo#javascript)
1. Persisting sessions across server restarts
1. Handling token refreshes
1. Retrieving more than the first 100 transactions (via pagination)

The code is also available on [GitHub](https://github.com/mrw34/monzo-api-boilerplate)
