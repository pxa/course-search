# Require any additional compass plugins here.
#require 'susy'

# Set this to the root of your project when deployed:
http_path = "/"
css_dir = "app/css"
sass_dir = "sass"
images_dir = "app/img"
javascripts_dir = "app/js"

add_import_path "sass/lib"
add_import_path "sass/components"
add_import_path "sass/apps"

output_style = :compressed
environment = :production

# To enable relative paths to assets via compass helper functions. Uncomment:
# relative_assets = true

color_output = false


# If you prefer the indented syntax, you might want to regenerate this
# project again passing --syntax sass, or you can uncomment this:
# preferred_syntax = :sass
# and then run:
# sass-convert -R --from scss --to sass sass scss && rm -rf sass && mv scss sass
