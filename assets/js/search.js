
// Capitalises a string
// Accepts:
//   str: string
// Returns:
//   string
majusculeFirst = function(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
};

// Retrieves the value of a GET parameter with a given key
// Accepts:
//   param: string
// Returns:
//   string or null
getParam = function(param) {
  var queryString = window.location.search.substring(1),
      queries = queryString.split('&');
  for (var i in queries) {
    var pair = queries[i].split('=');
    if (pair[0] === param) {
      // Decode the parameter value, replacing %20 with a space etc.
      return decodeURI(pair[1]);
    }
  }
  return null;
};

// Filters posts with the condition `post['property'] == value`
// Accepts:
//   posts - array of post objects and a string
//   property - string of post object property to compare
//   value - filter value of property
// Returns:
//   array of post objects
filterPostsByPropertyValue = function(posts, property, value) {
  var filteredPosts = [];
  // The last element is a null terminator
  posts.pop();
  for (var i in posts) {
    var post = posts[i],
        prop = post[property];
    // Last element of tags is null
    post.tags.pop();

    // The property could be a string, such as a post's category,
    // or an array, such as a post's tags
    if (prop.constructor === String) {
      if (prop.toLowerCase() === value.toLowerCase()) {
        filteredPosts.push(post);
      }
    } else if (prop.constructor === Array) {
      for (var j in prop) {
        if (prop[j].toLowerCase() === value.toLowerCase()) {
          filteredPosts.push(post);
        }
      }
    }
  }

  return filteredPosts;
};

// Formats search results and appends them to the DOM
// Accepts:
//   property: string of object type we're displaying
//   value: string of name of object we're displaying
//   posts: array of post objects
// Returns:
//   undefined
layoutResultsPage = function(property, value, posts) {
  var $container = $('#index');
  if ($container.length === 0) return;

  // Update the header
  $container.find('h3').text(majusculeFirst(property)
    + ' Listing for ‘'
    + majusculeFirst(value)
    + '’'
  );

  for (var i in posts) {
    // Create an unordered list of the post's tags
    var tagsList = '<ul class="tags">',
        post     = posts[i],
        tags     = post.tags;

    for (var j in tags) {
      tagsList += ''
        + '<li>'
          + '<a href="/search.html?tags=' + tags[j] + '">' + tags[j] + '</a>'
        + '</li>';
    }
    tagsList += '</ul>';

    $container.append(
      '<article>'
        + '<h2>'
          + '<a href="' + post.href + '" title="' + post.title + '">' + post.title + '</a>'
        + '</h2>'
      + '</article>'
    );

    /*        // Post date
        + '<h2>'
          + post.date.formatted
          + ' in <a href="/search.html?category=' + post.category + '">'
          +  majusculeFirst(post.category) + '</a>'
        + '</h2>'
        // Tags
        + tagsList*/
  }
};

// Formats the search results page for no results
// Accepts:
//   property: string of object type we're displaying
//   value: string of name of object we're displaying
// Returns:
//   undefined
noResultsPage = function(property, value) {
   $('main').find('h1').text('No Results Found.').after(
    '<p>We couldn\'t find anything associated with ‘' + value + '’ here.</p>'
  );
};

// Replaces ERB-style tags with Liquid ones as we can't escape them in posts
// Accepts:
//   elements: jQuery elements in which to replace tags
// Returns:
//   undefined
replaceERBTags = function(elements) {
  elements.each(function() {
    // Only for text blocks at the moment as we'll strip highlighting otherwise
    var $this = $(this),
        txt   = $this.html();

    // Replace <%=  %>with {{ }}
    txt = txt.replace(new RegExp('&lt;%=(.+?)%&gt;', 'g'), '{{$1}}');
    // Replace <% %> with {% %}
    txt = txt.replace(new RegExp('&lt;%(.+?)%&gt;', 'g'), '{%$1%}');

    $this.html(txt);
  });
};

$(function() {
  var parameters = ['category', 'tags'];
  var map = {}
  for (var idx in parameters) {
    map[parameters[idx]] = getParam(parameters[idx]);
  }

  $.each(map, function(type, value) {
    if (value !== null) {
      $.getJSON('/search.json', function(data) {
        posts = filterPostsByPropertyValue(data, type, value);
        if (posts.length === 0) {
          noResultsPage(type, value);
        } else {
          layoutResultsPage(type, value, posts);
        }
      });
    }
  });

  // Replace ERB-style Liquid tags in highlighted code blocks...
  replaceERBTags($('div.highlight').find('code.text'));
  // ... and in inline code
  replaceERBTags($('p code'));
});