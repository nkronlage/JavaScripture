CONTENT_FOLDERS = $(shell ls -d content/*)
vpath %.jsdoc $(CONTENT_FOLDERS)
vpath %.ejs templates

OUTPUT=site
TEMP=tmp

JSDOC_FILES = $(shell find content -type f -name '*.jsdoc')
FLAT_JSDOC_FILES = $(notdir $(JSDOC_FILES))

JS_METADATA = $(addprefix $(TEMP)/, $(FLAT_JSDOC_FILES:%.jsdoc=%.json))
CONTENT_HTML = $(addprefix $(OUTPUT)/, $(FLAT_JSDOC_FILES:%.jsdoc=%.html))

OTHER_HTML_SOURCES = \
	feedback.html \
	home.html \
	license.html \
	thankyou.html \

OTHER_HTML = $(addprefix $(OUTPUT)/, $(OTHER_HTML_SOURCES))

STATIC_FILES = \
	favicon.ico \
	fireworks.ogv \
	pic.jpg \
	webgl-debug.js \

INPUT_STATIC_FILES = $(addprefix static/, $(STATIC_FILES))
OUTPUT_STATIC_FILES = $(addprefix $(OUTPUT)/, $(STATIC_FILES))

SOURCES = \
	$(CONTENT_HTML) \
	$(OTHER_HTML) \
	$(OUTPUT)/styles.css \
	$(OUTPUT)/javascripture.js \
	$(OUTPUT_STATIC_FILES) \

TEMPLATES_FILES = \
	bottomnav.ejs \
	example.ejs \
	htmlexample.ejs \
	leftnav.ejs \
	member.ejs \
	membergroup.ejs \
	methodgroup.ejs \
	object.ejs \
	page.ejs \

TEMPLATES = $(addprefix templates/, $(TEMPLATES_FILES))

.PHONY: all clean

all: $(SOURCES)

$(JS_METADATA): tmp/%.json: %.jsdoc 
	@mkdir -p $(@D) 
	node makemetadata.js $<
	@cmp -s $(TEMP)/new_$(@F) $@; \
	if [ $$? -ne 0 ]; then \
	  mv $(TEMP)/new_$(@F) $@; \
	else \
	  rm $(TEMP)/new_$(@F); \
	fi

$(TEMP)/apisets.json : $(JS_METADATA)
	node makeapisets.js $^
	@cmp -s $(TEMP)/new_$(@F) $@; \
	if [ $$? -ne 0 ]; then \
	  mv $(TEMP)/new_$(@F) $@; \
	else \
	  rm $(TEMP)/new_$(@F); \
	fi

$(CONTENT_HTML): site/%.html: %.jsdoc $(TEMP)/apisets.json $(TEMPLATES)
	@mkdir -p $(@D)
	node makepage.js $<

$(OTHER_HTML): site/%.html: %.ejs $(TEMP)/apisets.json $(TEMPLATES)
	node makecustompage.js $<

$(OUTPUT)/javascripture.js: javascripture.ejs $(TEMP)/apisets.json
	node makecustompage.js $<

$(OUTPUT)/styles.css: styles.scss
	sass styles.scss $(OUTPUT)/styles.css

$(OUTPUT_STATIC_FILES): $(OUTPUT)/%: static/%
	cp $< site/

clean: 
	rm -f $(TEMP)/*
	rm -f $(OUTPUT)/*
