<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { supabase } from '$lib/supabaseClient';


  type WaitlistEntry = {
    id: string;
    email: string;
    avatar_url?: string;
    created_at: string;
  };

  let email: string = "";
  // Use second code's states for more detailed feedback and loading
  let isLoading = false;
  // isSubmitted from first code controls showing form vs thanks message permanently
  let successfullyJoined = false;
  // isSubmitted from second code is temporary feedback on the button
  let temporarySubmittedFeedback = false;
  let errorMessage: string | null = null;

  let waitlist: WaitlistEntry[] = [];

  // Initialize timeRemaining as an object
  let timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  let timerInterval: NodeJS.Timeout; // Timer interval variable for cleanup

  // Basic email validation regex
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

   const addToWaitlist = async () => {
    if (!email.trim()) {
      errorMessage = 'Please enter your email address.';
      return;
    }
    if (!isValidEmail(email)) {
      errorMessage = 'Please enter a valid email address.';
      return;
    }
    if (isLoading) {
      return;
    }

    isLoading = true;
    errorMessage = null;
    temporarySubmittedFeedback = false;

    try {
      // Generate DiceBear Initials URL directly
      // Trim whitespace and convert to lowercase before encoding
      const dicebearUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(email.trim().toLowerCase() || 'user')}`;


      // Check if email already exists
      const { count } = await supabase
        .from('waitlist')
        .select('email', { count: 'exact', head: true })
        .eq('email', email.trim().toLowerCase());

      if (count && count > 0) {
        errorMessage = 'This email is already on the waitlist.';
        isLoading = false;
        return;
      }

      // Insert the email and the generated DiceBear URL
      const { data, error } = await supabase
        .from('waitlist')
        .insert([{ email: email.trim().toLowerCase(), avatar_url: dicebearUrl }])
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        errorMessage = 'Failed to join the waitlist. Please try again later.';
      } else if (data && data.length > 0) {
        waitlist = [data[0], ...waitlist]; // Add new entry to display
        email = ''; // Clear the input field
        successfullyJoined = true; // Permanent state change
        temporarySubmittedFeedback = true; // Trigger temporary button feedback
        setTimeout(() => (temporarySubmittedFeedback = false), 3000); // Reset temporary state
      } else {
        errorMessage = 'Successfully submitted, but could not retrieve data.';
      }
    } catch (e) {
      console.error('addToWaitlist error:', e);
      errorMessage = 'An unexpected error occurred.';
    } finally {
      isLoading = false;
    }
  };

  // Function to fetch the latest waitlist entries
  const fetchWaitlist = async () => {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*') // avatar_url will now contain DiceBear URLs
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase fetch error:', error);
    } else if (data) {
      waitlist = data;
    }
  };

  // Function to calculate and update time remaining
 const updateTime = () => {
    // Set the release date to roughly 2 months from now (July 15, 2025)
    // NOTE: Replace this with your actual release date in YYYY-MM-DDTHH:mm:ssZ format
    const releaseDate = new Date('2025-07-15T00:00:00Z'); // Updated date
    const now = new Date();
    const diff = releaseDate.getTime() - now.getTime(); // Difference in milliseconds

    // Ensure diff is not negative (after the date has passed)
    if (diff <= 0) {
      timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };
      clearInterval(timerInterval); // Stop the timer if date is reached
      return;
    }

    timeRemaining = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60)
    };
  };

  // onMount block for initialization
  onMount(() => {
    // Fetch initial waitlist data
    fetchWaitlist();

    // Initialize and start the timer
    updateTime(); // Call once immediately
    timerInterval = setInterval(updateTime, 1000); // Set interval and store its ID
  });

  // onDestroy lifecycle hook for cleanup
  onDestroy(() => {
    // Clear the timer interval when the component is destroyed
    if (timerInterval) {
      clearInterval(timerInterval);
    }
  });
</script>

<style>
  /* Merged and adapted styles */
  :global(body) {
    /* Using the gradient background from the second code */
    background: linear-gradient(135deg, #eef2f7 0%, #e0e7ee 100%);
    margin: 0;
    /* Using the font from the first code as it's unique */
    font-family: 'IBM Plex Mono', monospace;
    color: #111; /* Keeping primary text color from first code */
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    box-sizing: border-box;
    overflow-x: hidden; /* Prevent horizontal scroll */
  }

  .page {
    position: relative;
    /* Removed min-height: 100vh; from here as body handles it */
    padding: 4rem 2rem; /* Keep generous padding */
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: hidden;
    /* Add background and shadow from second code's container */
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    max-width: 700px; /* Adjusted max-width */
    width: 100%;
    text-align: center; /* Center text */
    box-sizing: border-box;
    margin: auto; /* Center the block horizontally */
  }

  .branding {
    font-size: 1.5rem;
    font-weight: bold;
    width: 60px;

    border-radius: 15px;
  }

  .headline {
    font-size: 2.75rem;
    text-align: center;
    max-width: 700px;
    margin-top: 2rem;
    line-height: 1.2;
    color: #1b1b1b; /* Using the darker blue-gray from second code */
  }

  .subheadline {
    font-size: 1.125rem;
    color: #555; /* Keeping color from first code, fits well */
    text-align: center;
    max-width: 600px;
    margin-top: 1rem;
    margin-bottom: -1rem; /* Added bottom margin to separate from form */
  }
    .subheadline-1 {
    font-size: 1.125rem;
    color: #555; /* Keeping color from first code, fits well */
    text-align: center;
    max-width: 600px;
    margin-top: 1rem;
    margin-bottom: 2.5rem; /* Added bottom margin to separate from form */
  }

  /* Combined and adapted form/input styles */
  .form {
    display: flex;
    gap: 1rem; /* Keep gap from first code */
    margin-top: 2rem;
    margin-bottom: 2.5rem; /* Added margin to separate from avatars */
    flex-wrap: wrap;
    justify-content: center;
    max-width: 450px; /* Max width for input area */
    width: 100%;
    box-sizing: border-box;
  }

  .form input {
    flex: 1; /* Allow input to grow */
    padding: 1rem 1.5rem; /* Using padding from second code */
    border: 1px solid #aaa; /* Keeping border color from first code */
    border-radius: 8px;
    font-size: 1rem;
    /* Removed width: 280px; as flex handles width */
    background: #fff;
    transition: all 0.3s ease; /* Add transition */
    appearance: none;
    box-sizing: border-box;
  }

    .form input:focus {
		outline: none;
		border-color: #3498db; /* Blue focus from second code */
		box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.2); /* Blue glow on focus from second code */
	}


  .form button {
    padding: 0.75rem 1.5rem; /* Keep padding from first code */
    background: #111; /* Keep background from first code */
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.2s ease, background 0.3s ease, opacity 0.3s ease; /* Combined transitions */
    min-width: 120px; /* Minimum width from second code */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); /* Added shadow from second code (slightly adjusted) */
  }

  .form button:hover {
    transform: scale(1.05); /* Keep hover effect from first code */
    background: #333; /* Slightly darker hover */
    box-shadow: 0 7px 18px rgba(0, 0, 0, 0.15);
  }

    .form button:active {
        transform: scale(1);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }


  .form button:disabled {
        background: #bdc3c7; /* Gray when disabled from second code */
        cursor: not-allowed;
        box-shadow: none;
        transform: none;
        opacity: 0.7;
    }

  .form button.loading {
      background: #bdc3c7; /* Indicate loading with gray from second code */
      pointer-events: none;
      opacity: 0.9;
  }

  .form button.submitted {
      background: #2ecc71; /* Green when submitted from second code */
      pointer-events: none;
  }

  /* Combined and adapted avatar styles */
  .avatars {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem; /* Using slightly smaller gap from second code */
    margin-top: 2.5rem; /* Using margin from second code */
    margin-bottom: 2.5rem; /* Added bottom margin */
    justify-content: center;
  }

  .avatar {
    width: 45px; /* Using size from second code */
    height: 45px;
    border-radius: 9999px; /* Keep rounded corners from first code */
    background: #ccc; /* Fallback background */
    /* Removed grayscale filter */
    border: 3px solid rgba(255, 255, 255, 0.8); /* Using border from second code */
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15); /* Using shadow from second code */
    transition: transform 0.3s ease, box-shadow 0.3s ease; /* Combined transitions */
    object-fit: cover; /* Ensure image covers the area */
  }

    .avatar:hover {
        transform: scale(1.15); /* Keep hover effect from second code */
        box-shadow: 0 5px 12px rgba(0, 0, 0, 0.2);
    }


  .canvas-container {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    /* Removed canvas specific background */
  }

  /* NOTE: The canvas drawing logic is not included here */
  canvas {
    width: 100%;
    height: 100%;
    display: block; /* Remove extra space below canvas */
  }

  .thanks {
    margin-top: 2rem;
    font-size: 1.125rem; /* Slightly larger font */
    color: #444; /* Keeping color from first code */
    text-align: center;
    margin-bottom: 2.5rem; /* Added bottom margin */
  }

  /* Second code specific styles */
  .join-count {
    color: #7f8c8d; /* Muted gray */
    font-size: 1rem;
    margin: 1.5rem 0;
  }

  .error-message {
    color: #e74c3c; /* Red for errors */
    margin-top: 1rem;
    font-size: 0.9rem;
    text-align: center;
    width: 100%; /* Ensure error message takes full width in flex */
  }


  .timer {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    margin-top: 3rem;
    padding: 2rem 0;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    flex-wrap: wrap;
    width: 100%; /* Timer takes full width of container */
    box-sizing: border-box;
  }

  .timer-item {
    text-align: center;
    min-width: 60px;
  }

  .value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1;
  }

  .label {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-top: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .divider {
    color: #bdc3c7;
    font-weight: 500;
    font-size: 1.5rem;
    margin: 0 0.8rem;
  }

  /* Responsive adjustments */
  @media (max-width: 600px) {
    .page {
      padding: 1.5rem 1rem;
    }

    .headline {
        font-size: 2rem;
    }

    .subheadline {
        font-size: 1rem;
        margin-bottom: 1.5rem;
    }

    .form {
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
        max-width: 100%;
    }

    .form input, .form button {
        width: 100%;
        max-width: none;
    }

    .avatars {
        gap: 0.4rem;
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
    }

    .avatar {
        width: 35px;
        height: 35px;
    }

    .timer {
        gap: 1rem;
        padding: 1.5rem 0.5rem;
        margin-top: 2rem;
    }

    .value {
        font-size: 2rem;
    }

    .label {
        font-size: 0.8rem;
    }

    .divider {
        margin: 0 0.3rem;
        font-size: 1.2rem;
    }

    .thanks {
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
    }
  }
</style>

<div class="page">
  <div class="branding">
    <img src="dotient.png" alt="App Icon" />
  </div>

  <h1 class="headline">A Light Canvas for Structured Thought</h1>
  <p class="subheadline">Dotient helps you spatially organize your ideas.</p>
  <p class="subheadline-1">Minimal, fast, and built for thinkers.</p>

  {#if !successfullyJoined}
    <form class="form" on:submit|preventDefault={addToWaitlist}>
      <input
        type="email"
        placeholder="Enter your email..."
        bind:value={email}
        required
        disabled={isLoading}
        on:keydown={(e) => e.key === 'Enter' && addToWaitlist()}
      />
      <button
        type="submit"
        on:click={addToWaitlist}
        class:loading={isLoading}
        class:submitted={temporarySubmittedFeedback}
        disabled={isLoading || temporarySubmittedFeedback}
      >
        {#if isLoading}
          Loading...
        {:else if temporarySubmittedFeedback}
          Joined!
        {:else}
          Join Waitlist
        {/if}
      </button>
       {#if errorMessage}
         <p class="error-message">{errorMessage}</p>
      {/if}
    </form>

  {:else}
    <div class="thanks">You're on the waitlist! We'll be in touch soon.</div>
  {/if}

  {#if waitlist.length > 0}
    <p class="join-count">Join {waitlist.length}+ others on the waitlist</p>
    <div class="avatars">
      {#each waitlist as user (user.id)}
        <img
          src={user.avatar_url}
          class="avatar"
          alt="User avatar"
          on:error={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.backgroundColor = '#ccc'; // Show grey background
            target.src = ''; // Clear broken image icon
          }}
        />
      {/each}
    </div>
  {/if}


  <div class="timer">
    <div class="timer-item">
      <div class="value">{String(timeRemaining.days).padStart(2, '0')}</div>
      <div class="label">Days</div>
    </div>
    <div class="divider">:</div>
    <div class="timer-item">
      <div class="value">{String(timeRemaining.hours).padStart(2, '0')}</div>
      <div class="label">Hours</div>
    </div>
    <div class="divider">:</div>
    <div class="timer-item">
      <div class="value">{String(timeRemaining.minutes).padStart(2, '0')}</div>
      <div class="label">Minutes</div>
    </div>
    <div class="divider">:</div>
    <div class="timer-item">
      <div class="value">{String(timeRemaining.seconds).padStart(2, '0')}</div>
      <div class="label">Seconds</div>
    </div>
  </div>


  <div class="canvas-container">
    <canvas id="halftone-bg"></canvas>
  </div>
</div>