(() => {
  const STORAGE_KEY = 'minigram-state-v1';

  // DOM helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Small utils
  const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`;
  const esc = (s) => String(s || '').replace(/[&<>"'`]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[m]));
  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - ts) / 1000);
    const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24), w = Math.floor(d / 7);
    if (s < 60) return `${s}s ago`;
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return `${w}w ago`;
  };

  // Inline SVG icons
  const icon = (name, filled = false) => {
    const common = 'width="24" height="24" viewBox="0 0 24 24"';
    switch (name) {
      case 'home': return `<svg ${common} fill="${filled ? 'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z"/></svg>`;
      case 'plus': return `<svg ${common} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`;
      case 'heart': return filled
        ? `<svg ${common} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41 1.02 4.07 2.53C11.23 5.02 12.9 4 14.64 4 17.14 4 19.14 6 19.14 8.5c0 3.78-3.4 6.86-8.59 11.54L12 21.35z"/></svg>`
        : `<svg ${common} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
      case 'comment': return `<svg ${common} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8z"/></svg>`;
      case 'send': return `<svg ${common} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>`;
      case 'save': return filled
        ? `<svg ${common} fill="currentColor"><path d="M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2z"/></svg>`
        : `<svg ${common} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
      case 'more': return `<svg ${common} fill="currentColor"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>`;
      default: return '';
    }
  };

  // State
  let DB = loadState() || seed();
  const currentUserId = () => DB.currentUserId;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); }

  function seed() {
    const u1 = { id: 'u_me', username: 'you', name: 'You', avatar: 'https://i.pravatar.cc/300?img=3', bio: 'Photographer & traveler ✈️' };
    const u2 = { id: 'u_alex', username: 'alex', name: 'Alex Morgan', avatar: 'https://i.pravatar.cc/300?img=5', bio: 'Coffee. Code. Repeat.' };
    const u3 = { id: 'u_jordan', username: 'jordan', name: 'Jordan Lee', avatar: 'https://i.pravatar.cc/300?img=12', bio: 'City lights and nights.' };

    const posts = [
      p(u2, 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1400&auto=format&fit=crop', 'Sunday vibes ☕️'),
      p(u3, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop', 'Golden hour hits different'),
      p(u2, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop', 'Take me to the ocean 🌊'),
      p(u3, 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1400&auto=format&fit=crop', 'Foggy mornings'),
    ];
    // sprinkle likes/comments
    posts[0].likes.push('u_me', 'u_jordan');
    posts[0].comments.push(c(u3, 'Love this!'));
    posts[1].likes.push('u_me');
    posts[2].comments.push(c(u_me(), 'Need this trip.'));
    posts[3].likes.push('u_alex');

    function p(user, img, caption) {
      return {
        id: uid('p'), authorId: user.id, image: img,
        caption, createdAt: Date.now() - rand(1, 200) * 60_000,
        likes: [], comments: []
      };
    }
    function c(user, text) {
      return { id: uid('c'), userId: user.id, text, createdAt: Date.now() - rand(1, 120) * 1000 };
    }
    function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function u_me() { return u1; }

    return {
      users: [u1, u2, u3],
      posts,
      follows: { // followerId -> [followingIds]
        [u1.id]: [u2.id, u3.id],
        [u2.id]: [u3.id],
        [u3.id]: [],
      },
      currentUserId: u1.id,
      saved: { [u1.id]: [] } // saved posts map if needed later
    };
  }

  // Data helpers
  const getUser = (id) => DB.users.find(u => u.id === id);
  const getUserByUsername = (username) => DB.users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
  const userPosts = (userId) => DB.posts.filter(p => p.authorId === userId).sort((a,b)=>b.createdAt - a.createdAt);
  const feedPosts = () => {
    const me = currentUserId();
    const following = new Set(DB.follows[me] || []);
    // include my posts + following
    return DB.posts.filter(p => p.authorId === me || following.has(p.authorId)).sort((a,b)=>b.createdAt - a.createdAt);
  };
  const isFollowing = (targetId) => (DB.follows[currentUserId()] || []).includes(targetId);
  const followersCount = (userId) => Object.values(DB.follows).filter(arr => (arr || []).includes(userId)).length;
  const followingCount = (userId) => (DB.follows[userId] || []).length;
  const likesCount = (post) => (post.likes || []).length;
  const isLiked = (post, userId) => (post.likes || []).includes(userId);

  // Routing
  function route() {
    const hash = location.hash.replace(/^#/, '');
    const parts = hash.split('/').filter(Boolean);
    if (parts[0] === 'profile') {
      return { name: 'profile', username: parts[1] };
    }
    return { name: 'feed' };
  }

  // Render
  function render() {
    renderNavbar();

    const r = route();
    if (r.name === 'profile') {
      const username = r.username || getUser(currentUserId()).username;
      const user = getUserByUsername(username);
      if (!user) {
        $('#app').innerHTML = `<div class="feed"><p>User not found.</p></div>`;
        return;
      }
      renderProfile(user);
    } else {
      renderFeed();
    }
  }

  function renderNavbar() {
    const me = getUser(currentUserId());
    $('#navbar').innerHTML = `
      <div class="brand">MiniGram</div>
      <div class="nav-actions">
        <a class="icon-btn" href="#/feed" title="Home" aria-label="Home">
          <span class="icon">${icon('home', route().name === 'feed')}</span>
        </a>
        <button class="icon-btn" data-action="open-new-post" title="New Post" aria-label="New Post">
          <span class="icon">${icon('plus')}</span>
        </button>
        <a class="icon-btn" href="#/profile/${esc(me.username)}" title="Profile" aria-label="Profile">
          <img class="avatar" src="${esc(me.avatar)}" alt="me"/>
        </a>
      </div>
    `;
  }

  function renderFeed() {
    const posts = feedPosts();
    $('#app').innerHTML = `
      <section class="feed">
        ${posts.map(postCard).join('')}
      </section>
    `;
  }

  function postCard(p) {
    const user = getUser(p.authorId);
    const liked = isLiked(p, currentUserId());
    return `
      <article class="post-card" data-post-id="${p.id}">
        <div class="post-header">
          <a class="link" href="#/profile/${esc(user.username)}"><img class="avatar" src="${esc(user.avatar)}" alt="${esc(user.username)}"/></a>
          <a class="username" href="#/profile/${esc(user.username)}">${esc(user.username)}</a>
          <button class="icon-btn more" title="More">${icon('more')}</button>
        </div>
        <div class="post-media">
          <img class="post-image" src="${esc(p.image)}" alt="post image" data-action="dbl-like" data-post-id="${p.id}"/>
        </div>
        <div class="post-actions">
          <button class="icon-btn like-btn ${liked ? 'liked':''}" data-action="toggle-like" data-post-id="${p.id}" aria-label="Like">
            ${icon('heart', liked)}
          </button>
          <button class="icon-btn" data-action="focus-comment" data-post-id="${p.id}" aria-label="Comment">
            ${icon('comment')}
          </button>
          <button class="icon-btn" title="Share" aria-label="Share">${icon('send')}</button>
          <div class="spacer"></div>
          <button class="icon-btn" title="Save" aria-label="Save">${icon('save')}</button>
        </div>
        <div class="post-body">
          <div class="likes">${likesCount(p)} likes</div>
          ${p.caption ? `<div class="caption"><a class="username" href="#/profile/${esc(user.username)}">${esc(user.username)}</a>${esc(p.caption)}</div>` : ''}
          <div class="comments">
            ${p.comments.map(cm => renderComment(cm)).join('')}
          </div>
          <div class="time muted">${timeAgo(p.createdAt)}</div>
        </div>
        <form class="add-comment" data-form="add-comment" data-post-id="${p.id}">
          <input type="text" name="text" placeholder="Add a comment..." autocomplete="off" />
          <button type="submit" disabled>Post</button>
        </form>
      </article>
    `;
  }

  function renderComment(cm) {
    const u = getUser(cm.userId);
    return `<div class="comment"><a class="u link" href="#/profile/${esc(u.username)}">${esc(u.username)}</a><span class="t">${esc(cm.text)}</span></div>`;
  }

  function renderProfile(user) {
    const meId = currentUserId();
    const mine = user.id === meId;
    const posts = userPosts(user.id);

    $('#app').innerHTML = `
      <section class="profile">
        <div class="profile-header">
          <div class="profile-avatar"><img class="avatar lg" src="${esc(user.avatar)}" alt="${esc(user.username)}" /></div>
          <div class="profile-info">
            <div class="profile-row">
              <div class="profile-username">${esc(user.username)}</div>
              <div class="profile-actions">
                ${mine
                  ? `<a class="btn" href="#/feed">Edit Profile</a>`
                  : `<button class="btn ${isFollowing(user.id) ? '' : 'primary'}" data-action="toggle-follow" data-user-id="${user.id}">
                      ${isFollowing(user.id) ? 'Following' : 'Follow'}
                     </button>`}
                <button class="btn ghost" data-action="open-new-post">New Post</button>
              </div>
            </div>
            <div class="profile-stats">
              <div class="stat"><b>${posts.length}</b> posts</div>
              <div class="stat"><b>${followersCount(user.id)}</b> followers</div>
              <div class="stat"><b>${followingCount(user.id)}</b> following</div>
            </div>
            <div class="profile-bio">
              <div><b>${esc(user.name)}</b></div>
              <div>${esc(user.bio || '')}</div>
            </div>
          </div>
        </div>

        <div class="grid">
          ${posts.map(p => `
            <a class="cell" href="#/feed" title="Open in feed">
              <img src="${esc(p.image)}" alt="post"/>
            </a>
          `).join('')}
        </div>
      </section>
    `;
  }

  // Actions
  function toggleLike(postId) {
    const post = DB.posts.find(p => p.id === postId);
    if (!post) return;
    const me = currentUserId();
    post.likes = post.likes || [];
    const i = post.likes.indexOf(me);
    if (i >= 0) post.likes.splice(i, 1); else post.likes.push(me);
    saveState();
    rerenderPost(postId);
  }

  function addComment(postId, text) {
    const post = DB.posts.find(p => p.id === postId);
    if (!post) return;
    post.comments.push({ id: uid('c'), userId: currentUserId(), text: text.trim(), createdAt: Date.now() });
    saveState();
    rerenderPost(postId);
  }

  function rerenderPost(postId) {
    const el = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (!el) { render(); return; }
    const post = DB.posts.find(p => p.id === postId);
    el.innerHTML = postCard(post).replace(/^<article[^>]*>|<\/article>$/g, ''); // use inner part
  }

  function toggleFollow(targetUserId) {
    const me = currentUserId();
    DB.follows[me] = DB.follows[me] || [];
    const arr = DB.follows[me];
    const i = arr.indexOf(targetUserId);
    if (i >= 0) arr.splice(i, 1); else arr.push(targetUserId);
    saveState();
    render();
  }

  function openNewPostModal() {
    const root = $('#modal-root');
    const id = uid('modal');
    let previewSrc = '';
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-id="${id}">
        <div class="modal" role="dialog" aria-modal="true">
          <header>
            <span>Create new post</span>
            <button class="icon-btn" data-action="close-modal">${icon('more')}</button>
          </header>
          <div class="content">
            <div class="row">
              <label>Image URL</label>
              <input class="input" type="url" placeholder="https://..." data-role="img-url"/>
            </div>
            <div class="row">
              <label>Or upload image</label>
              <input class="input" type="file" accept="image/*" data-role="img-file"/>
            </div>
            <div class="preview" data-role="preview">No image selected</div>
            <div class="row">
              <label>Caption</label>
              <textarea class="textarea" rows="3" data-role="caption" placeholder="Write a caption..."></textarea>
            </div>
            <div class="actions">
              <button class="btn" data-action="close-modal">Cancel</button>
              <button class="btn primary" data-action="create-post" disabled>Create</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const urlInput = $('[data-role="img-url"]', root);
    const fileInput = $('[data-role="img-file"]', root);
    const preview = $('[data-role="preview"]', root);
    const caption = $('[data-role="caption"]', root);
    const createBtn = $('[data-action="create-post"]', root);

    function updatePreview(src) {
      previewSrc = src;
      if (!src) {
        preview.innerHTML = 'No image selected';
        createBtn.disabled = true;
      } else {
        preview.innerHTML = `<img src="${esc(src)}" alt="preview"/>`;
        createBtn.disabled = false;
      }
    }

    urlInput.addEventListener('input', () => {
      if (urlInput.value.trim()) updatePreview(urlInput.value.trim());
      else if (!fileInput.files?.[0]) updatePreview('');
    });
    fileInput.addEventListener('change', () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return updatePreview('');
      const reader = new FileReader();
      reader.onload = () => updatePreview(reader.result);
      reader.readAsDataURL(f);
    });

    root.addEventListener('click', (e) => {
      const close = e.target.closest('[data-action="close-modal"]');
      const backdrop = e.target.classList.contains('modal-backdrop') ? e.target : null;
      const create = e.target.closest('[data-action="create-post"]');
      if (close || backdrop) root.innerHTML = '';
      if (create) {
        createPost(previewSrc, caption.value);
        root.innerHTML = '';
        // After create, go to feed
        location.hash = '#/feed';
      }
    }, { once: false });
  }

  function createPost(imageSrc, caption) {
    if (!imageSrc) return;
    DB.posts.push({
      id: uid('p'),
      authorId: currentUserId(),
      image: imageSrc,
      caption: caption?.trim() || '',
      createdAt: Date.now(),
      likes: [],
      comments: []
    });
    saveState();
    render();
  }

  // Global event delegation
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]');
    if (!a) return;
    const act = a.getAttribute('data-action');

    if (act === 'toggle-like') {
      const postId = a.getAttribute('data-post-id');
      toggleLike(postId);
    }
    if (act === 'focus-comment') {
      const postId = a.getAttribute('data-post-id');
      const form = document.querySelector(`.add-comment[data-post-id="${postId}"]`);
      form?.querySelector('input')?.focus();
    }
    if (act === 'toggle-follow') {
      const targetId = a.getAttribute('data-user-id');
      toggleFollow(targetId);
    }
    if (act === 'open-new-post') {
      openNewPostModal();
    }
    if (act === 'close-modal') {
      $('#modal-root').innerHTML = '';
    }
  });

  // Double-click like on image
  document.addEventListener('dblclick', (e) => {
    const img = e.target.closest('[data-action="dbl-like"]');
    if (!img) return;
    const postId = img.getAttribute('data-post-id');
    const post = DB.posts.find(p => p.id === postId);
    if (!post) return;
    if (!isLiked(post, currentUserId())) toggleLike(postId);
  });

  // Enable/disable "Post" button in comment forms + submit
  document.addEventListener('input', (e) => {
    const form = e.target.closest('form.add-comment');
    if (!form) return;
    const btn = form.querySelector('button[type="submit"]');
    const val = form.querySelector('input[name="text"]').value.trim();
    btn.disabled = val.length === 0;
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form.add-comment');
    if (!form) return;
    e.preventDefault();
    const postId = form.getAttribute('data-post-id');
    const text = form.querySelector('input[name="text"]').value;
    if (text.trim().length) {
      addComment(postId, text);
      form.reset();
      form.querySelector('button[type="submit"]').disabled = true;
    }
  });

  window.addEventListener('hashchange', render);

  // default route
  if (!location.hash) location.hash = '#/feed';
  render();

  // Debug helpers (optional)
  window.MINIGRAM = {
    reset: () => { localStorage.removeItem(STORAGE_KEY); DB = seed(); render(); },
    state: () => DB
  };
})();
