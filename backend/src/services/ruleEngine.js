// Converts '#0C6B58' into { r: 12, g: 107, b: 88 }
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16)
  };
}

// Straight-line distance between two colors in RGB space
function colorDistance(c1, c2) {
  return Math.sqrt(
    (c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2
  );
}

function checkModeration(assetData) {
  const status = assetData.moderation?.[0]?.status;

  if (status === 'approved') {
    return { status, passed: true, reason: '' };
  }

  if (status === 'pending') {
    return { status, passed: false, reason: 'Moderation is still pending' };
  }

  if (status === 'rejected') {
    const labels = assetData.moderation[0].response?.moderation_labels || [];
    const names = labels
      .map((label) => label.name || label.Name)
      .filter(Boolean)
      .join(', ');
    return {
      status,
      passed: false,
      reason: names ? `Flagged by moderation: ${names}` : 'Rejected by moderation'
    };
  }

  return { status: 'unavailable', passed: false, reason: 'No moderation result available' };
}

function checkDimensions(assetData, ruleConfig) {
  const { width, height } = assetData;
  const passed = width >= ruleConfig.minWidth && height >= ruleConfig.minHeight;

  return {
    width,
    height,
    passed,
    reason: passed
      ? ''
      : `Resolution ${width}x${height} is below minimum ${ruleConfig.minWidth}x${ruleConfig.minHeight}`
  };
}

function checkFormat(assetData, ruleConfig) {
  const value = assetData.format;
  const allowed = ruleConfig.allowedFormats.map((f) => f.toLowerCase());
  const passed = allowed.includes(String(value).toLowerCase());

  return {
    value,
    passed,
    reason: passed
      ? ''
      : `Format "${value}" is not allowed (allowed: ${allowed.join(', ')})`
  };
}

function checkBrandColor(assetData, ruleConfig) {
  // Cloudinary returns [hex, percentage] pairs sorted by dominance.
  // Keep only the top 3 hex strings.
  const dominantColors = (assetData.colors || []).slice(0, 3).map(([hex]) => hex);

  if (dominantColors.length === 0) {
    return { dominantColors, passed: false, reason: 'No color data available' };
  }

  let closest = Infinity;
  for (const hex of dominantColors) {
    const rgb = hexToRgb(hex);
    for (const brandHex of ruleConfig.brandColors) {
      const distance = colorDistance(rgb, hexToRgb(brandHex));
      if (distance < closest) closest = distance;
    }
  }

  const passed = closest <= ruleConfig.colorTolerance;

  return {
    dominantColors,
    passed,
    reason: passed
      ? ''
      : `No dominant color is close to the brand palette (closest distance ${Math.round(closest)}, allowed ${ruleConfig.colorTolerance})`
  };
}

// Runs all four checks. The return shape matches the `checks` field in the Asset schema.
function evaluateAsset(assetData, ruleConfig) {
  return {
    moderation: checkModeration(assetData),
    dimensions: checkDimensions(assetData, ruleConfig),
    format: checkFormat(assetData, ruleConfig),
    brandColor: checkBrandColor(assetData, ruleConfig)
  };
}

module.exports = {
  evaluateAsset,
  checkModeration,
  checkDimensions,
  checkFormat,
  checkBrandColor
};