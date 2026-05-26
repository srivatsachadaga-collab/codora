// 1. Core State Handlers
let supabaseClient = null; 
let activeComponentMemory = [];

// ==========================================
// 2. LIFECYCLE ORCHESTRATOR HOOK (DIRECT BACKEND LINK)
// ==========================================
document.addEventListener('DOMContentLoaded', initializeMarketplaceEngine);

async function initializeMarketplaceEngine() {
  // Hardcode the keys directly because this is pure frontend browser JavaScript
  const url = "https://ueueiprkuihdhnqsoebu.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVldWVpcHJrdWloZGhucXNvZWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Mzk0MzksImV4cCI6MjA5NTAxNTQzOX0.T4FglBRXzh_87SWzgSKdnIqBnc28jhpZjHuoA5-S0rE";

  if (!url || !key || url.includes("YOUR_ACTUAL")) {
    console.error("Configuration Error: Please paste your real Supabase strings inside app.js");
    displayErrorState("Initialization aborted: Missing credentials.");
    return;
  }

  try {
    // Fire up Supabase cleanly
    supabaseClient = window.supabase.createClient(url, key);
    console.log("Supabase connected successfully!");
    
    await queryCloudComponents();
  } catch (err) {
    console.error("Initialization crash:", err.message);
    displayErrorState(`Initialization Failure: ${err.message}`);
  }
  
  const searchBarInput = document.getElementById('search-input');
  if (searchBarInput) {
    searchBarInput.addEventListener('input', executeSearchQuery);
  }
}

// 3. Database Filter Query Pipeline
async function queryCloudComponents() {
  const { data, error } = await supabaseClient
    .from('components')
    .select('*');

  if (error) {
    console.error('Database query exception:', error.message);
    displayErrorState(`Supabase Database Error: ${error.message}`);
    return;
  }

  activeComponentMemory = data || [];
  renderComponentGrid(activeComponentMemory);
}

// 4. Output Generation UI Map Engine
function renderComponentGrid(items) {
  const grid = document.getElementById('component-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center text-sm text-zinc-500">
        No components matched your search parameters.
      </div>
    `;
    return;
  }

  const blockedTags = ['premium', 'pricing', 'price', 'pro', 'free'];

  items.forEach(item => {
    const tagsContainer = item.tags && Array.isArray(item.tags)
      ? item.tags
          .map(t => t.toLowerCase().trim())
          .filter(t => !blockedTags.includes(t) && t.length > 0)
          .map(t => `<span class="text-[10px] font-medium text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5">#${t}</span>`)
          .join(' ')
      : '';

    const cardMarkup = `
      <div id="card-${item.id}" class="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#121225] bg-[#070715]/60 backdrop-blur-md p-4 transition duration-200 hover:border-zinc-700/50 hover:bg-[#0a0a1f]">
        <div>
          <div onclick="openLightboxModal(\`${item.preview || ''}\`)" 
               class="hidden sm:block relative aspect-[1.48] w-full overflow-hidden rounded-xl bg-transparent border border-white/5 mb-4 cursor-zoom-in" 
               title="Click to zoom image">
            <img src="${item.preview || ''}" alt="${item.title || 'Component View'}" class="h-full w-full object-contain object-center transition duration-300 group-hover:scale-[1.02]" loading="lazy" />
          </div>
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-sm font-bold text-white tracking-tight truncate pr-2">${item.title || 'Untitled Component'}</h3>
            <button onclick="copyComponentMarkupCode(\`${encodeURIComponent(item.code || '')}\`)" class="text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-white/5">
              <svg style="width: 16px; height: 16px; min-width: 16px; min-height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <div class="flex flex-wrap gap-1 mt-1 mb-4 h-5 overflow-hidden">${tagsContainer}</div>
        </div>
        <div>
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-white/5">
            <div class="flex flex-wrap gap-1.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400">${item.framework || 'Tailwind'}</span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-500 uppercase">${item.category || 'UI'}</span>
            </div>
            <button onclick="registerDynamicUpvote(${item.id}, ${item.likes || 0})" class="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400 hover:text-pink-500 transition group/like">
              <svg id="heart-icon-${item.id}" style="width: 14px; height: 14px; min-width: 14px; min-height: 14px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span id="like-label-${item.id}" class="font-mono text-[11px]">${item.likes || 0}</span>
            </button>
          </div>
        </div>
      </div>
    `;
    grid.innerHTML += cardMarkup;
  });
}

// 5. Text Search Query Execution Parser
function executeSearchQuery() {
  const currentCriteria = document.getElementById('search-input').value.toLowerCase().trim();
  if (!currentCriteria) {
    renderComponentGrid(activeComponentMemory);
    return;
  }
  const matches = activeComponentMemory.filter(item => {
    return item.title?.toLowerCase().includes(currentCriteria) || 
           item.tags?.some(tag => tag.toLowerCase().includes(currentCriteria)) || 
           item.category?.toLowerCase().includes(currentCriteria) ||
           item.framework?.toLowerCase().includes(currentCriteria);
  });
  renderComponentGrid(matches);
}

// 6. Direct Copy System Clipboard Action API
function copyComponentMarkupCode(encodedBlob) {
  navigator.clipboard.writeText(decodeURIComponent(encodedBlob))
    .then(() => alert('Code copied directly to clipboard! 🚀'))
    .catch(err => console.error('Clipboard execution error:', err));
}

// 7. Supabase Realtime Like Execution Stream
async function registerDynamicUpvote(recordId, baselineVotes) {
  const finalVoteMatrix = baselineVotes + 1;
  const viewCounter = document.getElementById(`like-label-${recordId}`);
  const graphicIcon = document.getElementById(`heart-icon-${recordId}`);

  if (viewCounter) viewCounter.innerText = finalVoteMatrix;
  if (graphicIcon) {
    graphicIcon.setAttribute('fill', 'currentColor');
    graphicIcon.classList.add('text-pink-500');
  }

  const { error } = await supabaseClient
    .from('components')
    .update({ likes: finalVoteMatrix })
    .eq('id', recordId);

  if (error) {
    console.error('Like tracking error:', error.message);
    if (viewCounter) viewCounter.innerText = baselineVotes;
    if (graphicIcon) {
      graphicIcon.setAttribute('fill', 'none');
      graphicIcon.classList.remove('text-pink-500');
    }
  }
}

// 8. Visual Screen Error Alert Presenter
function displayErrorState(msg) {
  const container = document.getElementById('component-grid');
  if (container) {
    container.innerHTML = `
      <div class="col-span-full border border-red-500/20 bg-red-500/10 text-red-400 p-6 rounded-xl text-xs font-mono text-center shadow-lg">
        System Notice: ${msg}
      </div>
    `;
  }
}

// 9. LIGHTBOX IMAGE ENLARGE INTERFACE PIPELINES
window.openLightboxModal = function(imageSrc) {
  if (!imageSrc) return;
  const lightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-target-image');
  
  lightboxImg.src = imageSrc;
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent page scrolling while open
};

window.closeLightboxModal = function() {
  const lightbox = document.getElementById('image-lightbox');
  lightbox.classList.add('hidden');
  document.body.style.overflow = ''; // Restore page scrolling
};

// ==========================================
// 10. ADD CARD MODAL & NETLIFY SUBMISSION ROUTER
// ==========================================

// Open or close the form visual panel
window.toggleAddCardModal = function(shouldOpen) {
  const modal = document.getElementById('add-card-modal');
  if (!modal) return;
  
  if (shouldOpen) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.getElementById('marketplace-submission-form').reset();
  }
};

// Intercept submission event and send to Netlify via AJAX
const formElement = document.getElementById('marketplace-submission-form');
if (formElement) {
  formElement.addEventListener('submit', async (e) => {
    e.preventDefault(); // Keep page from reloading instantly

    const myForm = e.target;
    const formData = new FormData(myForm);
    
    try {
      // Post data directly to Netlify's route background processor
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });
      
      alert("Submission received successfully! Thank You");
      window.toggleAddCardModal(false);
    } catch (error) {
      console.error("Netlify Submission Error:", error);
      alert("Oops! Something went wrong while routing to Netlify backend logs.");
    }
  });
}