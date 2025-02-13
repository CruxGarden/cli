# Storylink CLI

Storylink CLI - A modern, flexible toolkit for interactive storytelling. Write your story in plain [Markdown](https://en.wikipedia.org/wiki/Markdown) files and export to many popular formats, including HTML (static and single-page), ePub, MOBI, PDF (links), and mobile apps using [Expo](https://expo.dev/).

## Quick Start

```bash
# Install globally
npm install -g @storylink/cli

# Create a new story
sli new my-story
cd my-story

# Start development server
sli dev

# Build for distribution
sli build
```

## Story Structure

Stories are written in Markdown with a simple directory structure:

```
my-story/
├── story.json          # Story metadata
└── links/              # Story content
    ├── opening/
    │   ├── index.md    # Starting link
    │   └── examine.md  # Another link
    └── chapter-1/
        ├── index.md    # Chapter opening
        └── scene-1.md  # Chapter link
```

### Link Format

Links are Markdown files with choices as other links:

```markdown
# The Cave Entrance

A cool breeze emerges from the dark cave mouth. Ancient symbols are carved above the entrance.

- [Enter the cave](../cave/index.md)
- [Examine the symbols](examine.md)
- [Turn back](../forest/index.md)
```

## Commands

### Creating Content

```bash
# New story project
sli new story-name

# New link
sli link "cave/entrance"
```

### Development

```bash
# Start dev server
sli dev

# Validate story
sli check
```

### Building

```bash
# Build static site (default)
sli build

# Build single HTML file
sli build --format html-single
```

## Build Formats

### HTML Static

- Creates directory structure
- Multiple HTML files
- Real URLs
- Easy to host

### HTML Single

- Everything in one file
- Easy to share
- Works offline
- Self-contained

## Development Server

The `sli dev` command provides:

- Live preview
- Auto-reload
- Story validation
- Link checking
- Progress tracking

## Story Configuration

The `story.json` file configures your story:

```json
{
  "title": "The Great Adventure",
  "author": "Jane Smith",
  "version": "1.0.0",
  "start": "opening/index.md"
}
```

# Creating Your First Story

This tutorial will walk you through creating an interactive story using Storylink. We'll create a creepy story about exploring a haunted house.

## Prerequisites

- Node.js installed (v22 or higher)
- Basic knowledge of Markdown
- A text editor (Obsidian recommended)

## Step 1: Installation

First, let's install Storylink's CLI tool globally:

```bash
npm install -g @storylink/cli
```

Verify the installation:

```bash
sli --version
```

## Step 2: Creating a New Story

Let's create a new story project:

```bash
# Create a new story
sli new haunted-house

# Move into the project directory
cd haunted-house
```

This creates a basic project structure:

```
haunted-house/
├── story.json
└── links/
    └── opening/
        └── index.md
```

## Step 3: Configure Your Story

Open `story.json` and update it:

```json
{
  "title": "The Haunted House",
  "author": "Your Name",
  "version": "1.0.0",
  "start": "opening/index.md"
}
```

## Step 4: Writing Your First Link

Let's edit the opening link. Open `links/opening/index.md`:

```markdown
# The Old House

You stand before an ancient Victorian house, its windows dark and shutters hanging loose. The evening fog swirls around your feet as you consider your next move.

- [Try the front door](entrance/front-door.md)
- [Check around back](entrance/back-yard.md)
- [Leave immediately](ending/leave.md)
```

## Step 5: Creating More Links

Create the links:

```bash
# Create entrance links
sli link entrance/front-door
sli link entrance/back-yard
sli link ending/leave
```

Now edit each link:

`links/entrance/front-door.md`:

```markdown
# The Front Door

The heavy wooden door creaks as you turn the brass handle. Surprisingly, it's unlocked.

- [Enter the house](../foyer/index.md)
- [Knock first](knock.md)
```

`links/entrance/back-yard.md`:

```markdown
# The Back Yard

Overgrown grass reaches your knees. Through the vegetation, you spot a cellar door.

- [Try the cellar door](../basement/index.md)
- [Go back to the front](../opening/index.md)
```

`links/ending/leave.md`:

```markdown
# A Wise Choice?

You decide this adventure isn't worth the risk. As you turn to leave, you hear what sounds like a child's laughter from an upstairs window...

- [Change your mind and go back](../opening/index.md)
- [Keep walking] -> The End
```

## Step 6: Testing Your Story

Start the development server:

```bash
sli dev
```

Visit `http://localhost:3000` in your browser. You can now:

- Navigate through your story
- See path tracking
- Test all links

## Step 7: Adding More Content

Let's add the foyer link:

```bash
sli link foyer/index
```

Edit `links/foyer/index.md`:

```markdown
# The Grand Foyer

Moonlight streams through dusty windows, illuminating a grand staircase. A doorway leads to what appears to be a library, and another to a dining room.

- [Climb the stairs](../upstairs/index.md)
- [Enter the library](../library/index.md)
- [Check the dining room](../dining/index.md)
- [Leave the house](../ending/leave.md)
```

## Step 8: Validating Your Story

Check for any broken links or issues:

```bash
sli check
```

Fix any problems that are found.

## Step 9: Building for Distribution

Build your story:

```bash
# Create a static website version
sli build

# Or create a single HTML file
sli build --format html-single
```

Your story will be available in the `dist` directory.

## Tips for Writing

1. **Link Organization**

   - Group related links in directories
   - Use descriptive filenames
   - Keep links focused

2. **Writing Style**

   - Write clear descriptions
   - Give meaningful choices
   - Keep paragraphs short
   - Use active voice

3. **Story Structure**
   - Plan major paths
   - Create interesting choices
   - Allow for different endings
   - Consider path length

## Story Structure Example

Here's how a complete story structure might look:

```
links/
├── opening/
│   └── index.md
├── entrance/
│   ├── front-door.md
│   ├── knock.md
│   └── back-yard.md
├── foyer/
│   └── index.md
├── library/
│   ├── index.md
│   ├── read-book.md
│   └── secret-door.md
├── dining/
│   ├── index.md
│   └── find-key.md
├── basement/
│   ├── index.md
│   └── discovery.md
└── ending/
    ├── leave.md
    ├── solve-mystery.md
    └── trapped.md
```

## Next Steps

1. **Expand Your Story**

   - Add more rooms
   - Create multiple endings
   - Include hidden paths
   - Add story items

2. **Polish Your Work**

   - Test all paths
   - Add descriptions
   - Balance choices
   - Check pacing

3. **Share Your Story**
   - Build final version
   - Test in different browsers
   - Share with friends
   - Gather feedback

## Common Patterns

1. **Chapter Organization**

```
links/
└── chapter-1/
    ├── index.md      # Chapter intro
    ├── scene-1.md    # First scene
    └── scene-2.md    # Second scene
```

2. **Branching Paths**

```
links/
└── choice/
    ├── path-a/
    │   └── index.md
    └── path-b/
        └── index.md
```

3. **Item Collection**

```markdown
# Library

You find an old key.

- [Take the key](take-key.md)
- [Leave it](leave-key.md)
```

## Getting Help

- Visit [storylink.dev](https://storylink.dev) for documentation
- Check [GitHub](https://github.com/StorylinkTools/cli) for issues
- Join our community for support

Now you're ready to create your own interactive stories with Storylink!

## Best Practices

1. **Link Organization**

   - Group related links in directories
   - Use descriptive names
   - Keep links focused
   - Make each link stand alone

2. **Writing**

   - Clear descriptions
   - Meaningful choices
   - Consistent style
   - Test all paths

3. **Development**
   - Regular validation
   - Test navigation
   - Check links
   - Use version control

## Future Features

- EPUB export
- PDF export
- More templates
- Story statistics
- Path visualization

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT - see [LICENSE](LICENSE) for details.

## Links

- [Documentation](https://storylink.dev)
- [GitHub](https://github.com/StorylinkTools/cli)
- [npm](https://www.npmjs.com/package/@storylink/cli)
