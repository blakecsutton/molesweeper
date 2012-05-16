from django.conf.urls.defaults import patterns

# Urls for static pages, which render directly to a template
urlpatterns = patterns('django.views.generic.simple',
    ((r'^$'), 'direct_to_template', {'template': 'molesweeper/molesweeper.html'})
)


