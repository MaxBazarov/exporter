# Exporter Plugin Hints

## [Hint 1](#hint1): Use post-processing to inject your own information in generated HTML

The main index.html contains a special placeholder **\<!\-\-VERSION\-\-\>**.

	<ul id="nav-title">
    	<li><div class="nav-title-label">Screen title <!--VERSION--></div><div class="title">Title</div></li>
    </ul>

You can replace it with some your own information, for example — you can show prototype version here.
The following command uses "sed" tool.

	sed -i '' "s/<!--VERSION-->/(v123)/g" "index.html"


## [Hint 2](#hint2): How to set external link for overrided symbol hotspot 

Sometimes you need to set an external URL for hotspot target. You can't use "Set External Link for layer" command in this case because it's not possible to select some of symbol childs. 

But you can follow the another way. 
- Create small empty artboard
- Use "Set External Link for layer" command for this artboard
- Select this artobard as a overrided target for your hotsport 
- Run Export to HTML to see a result

[Illustration](https://github.com/MaxBazarov/exporter/raw/master/tests/Pictures/Link-ExternalArtboard.png), [Example file](https://github.com/MaxBazarov/exporter/raw/master/tests/Link-ExternalArtboard.sketch)


## [Hint 3](#hint3): How to set a start/home page for a prototype
Select "Prototyping > Use Artboard as Start Point" menu item to mark/unmark the selected artboard as home.
