# Inspirehep News

A personalized paper feed for tracking publications from your favorite authors and collaborations on [INSPIRE-HEP](https://inspirehep.net).

## Features

- **Author Subscriptions**: Search and subscribe to authors to see their latest papers
- **Collaboration Tracking**: Follow physics collaborations (ATLAS, CMS, etc.)
- **Recent Papers Feed**: View papers from the last 3 months, sorted by date
- **Import/Export**: Backup and restore your subscription lists as JSON
- **MathJax Support**: Renders LaTeX equations in paper titles
- **Offline Storage**: Subscriptions persist in browser localStorage

## Usage

1. **Add Subscriptions**
   - Expand "Author Search" section
   - Enter an author name and click Search
   - Click on a result to subscribe
   - Toggle "Search Collaborations" to search for physics experiments instead

2. **View Papers**
   - Papers appear automatically once you have subscriptions
   - Use checkboxes to filter author papers vs collaboration papers
   - Click paper titles to view on INSPIRE-HEP

3. **Manage Subscriptions**
   - Expand "Subscriptions" to see your list
   - Click × to remove a subscription
   - Use Import/Export buttons to backup your lists

## Tech Stack

- Vanilla HTML/CSS/JavaScript
- [INSPIRE-HEP API](https://inspirehep.net/help/knowledge-base/inspire-api/)
- [MathJax](https://www.mathjax.org/) for LaTeX rendering
- [Fira Code](https://github.com/tonsky/FiraCode) font (Nerd Font variant)
- Tokyo Night color scheme

## Local Development

Simply open `index.html` in a browser. No build step required.

```bash
# Clone the repo
git clone https://github.com/ismasou/ismasou.github.io.git

# Open in browser
open index.html
```

## License

MIT
